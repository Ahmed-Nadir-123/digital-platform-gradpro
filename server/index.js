import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import {ItStaff}  from './Models/itStaff.js';
import {Manager} from './Models/Manager.js';
import {WorkflowSettings} from './Models/WorkflowSettings.js';
import {PurchaseRequest} from './Models/PurchaseRequest.js';






const app = express();



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, 'uploads')));



const port = 5000;

const connectString = "mongodb+srv://ahmednader2003331_db_user:ahmednader2003331_db_user@project.omsbiur.mongodb.net/fullstakeDb?appName=project";

mongoose.connect(connectString).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.log('Error connecting to MongoDB:', error);
});


app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ Try IT Staff first
        let user = await ItStaff.findOne({ email: email });
        let userType = "itstaff";

        // ✅ If not found, try Manager
        if (!user) {
            user = await Manager.findOne({ email: email }).select('+password');
            userType = "manager";
        }

        // ❌ Not found in either collection
        if (!user) {
            return res.status(400).json({
                message: "User not found."
            });
        }

        console.log("User Found:", user.personal_name, "Type:", userType);

        // ✅ Compare password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Authentication failed."
            });
        }

        console.log("✅ Login successful for:", user.email);

        // ✅ Prepare response
        const userResponse = user.toObject();
        delete userResponse.password; // Remove password from response

        if (!userResponse.photoUrl || userResponse.photoUrl.trim() === "") {
            userResponse.photoUrl = "/uploads/default_avatar.png";
        }

        res.status(200).json({
            message: "Login successful.",
            user: userResponse,
            userType: userType // ✅ Important: Frontend knows user type
        });

    } catch (error) {
        res.status(500).json({
            message: "An error occurred during login." + error.message
        });
        console.log("Login error:", error);
    }
});


app.post("/logout", (req,res)=>{
    res.status(200).json({message: "Logout successful."});


});




async function generateRequestId(){
    const count = await PurchaseRequest.countDocuments();
    const newId = (count + 1).toString().padStart(8, '0');
    return `BUY${newId}`;
}


app.post("/purchaseRequests", async (req,res) =>{
    try{
        const {
            requesterId,
            itemName,
            quantity,
            urgency,
            estimatedBudget,
            justification,
            additionalNotes
        } = req.body;

        if (!requesterId || !itemName || !quantity || !urgency) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const requester = await ItStaff.findById(requesterId);
        if (!requester) {
            return res.status(404).json({ message: "Requester not found." });
        }

        const requestId = await generateRequestId();

        const workflow = await WorkflowSettings.findOne({type : 'PurchaseRequest'}).populate("steps.approverId");

        if(!workflow || workflow.steps.length === 0){
            return res.status(500).json({message: "Workflow not configured properly. Please contact administrator."});
        }

        workflow.steps.sort((a,b) => a.sequence_value - b.sequence_value);

        const approvalFlow = workflow.steps.map(step => ({
            approverId: step.approverId._id,
            role: step.role,
            action: 'Pending',
            comment: '',
            currentApprover: step.approverId.personal_name
        }));


        const purchaseRequest = new PurchaseRequest({
            requestId: requestId,
            requesterId,
            itemName,
            quantity,
            urgency,
            estimatedBudget: estimatedBudget || "",
            justification: justification || "",
            additionalNotes: additionalNotes || "",
            expectedDeliveryDate: null,
            status: 'Pending',
            currentStep: 1,
            approvalFlow
        });

        await purchaseRequest.save();

        console.log("✅ Purchase request created:", purchaseRequest.requestId ,"by", requester.personal_name);

        res.status(201).json({
            message: "Purchase request created successfully.",
            requestId: requestId,
            currentApprover: approvalFlow[0].currentApprover,
            status: purchaseRequest.status
        });

    } catch(error){
        res.status(500).json({ message: "An error occurred while creating the purchase request." + error.message });
        console.log("Error creating purchase request:", error);
    }
});



app.post("/purchaseRequests/:requestId/approve", async (req, res) => {
    try {
        const { requestId } = req.params;

        const {
            approverId,
            action,
            comment,
            expectedDeliveryDate
        } = req.body;

        if (!["Approved", "Rejected"].includes(action)) {
            return res.status(400).json({ message: "Invalid action. Must be 'Approved' or 'Rejected'." });
        }

        // ✅ Find request
        const request = await PurchaseRequest.findOne({ requestId: requestId });

        if (!request) {
            return res.status(404).json({ message: "Purchase request not found." });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({ message: "This request is already: " + request.status.toLowerCase() + "." });
        }

        // ✅ Find manager
        const manager = await Manager.findById(approverId);
        if (!manager) {
            return res.status(404).json({ message: "Manager not found." });
        }

        console.log("🔍 Authorization Check:", {
            requestId: request.requestId,
            managerName: manager.personal_name,
            managerRole: manager.role,
            managerId: manager._id.toString(),
            currentStep: request.currentStep,
            totalSteps: request.approvalFlow.length
        });

        // ✅ Get current approval step
        const currentStepIndex = request.currentStep - 1;
        const currentApproval = request.approvalFlow[currentStepIndex];

        console.log("📋 Current Approval Details:", {
            currentStepIndex: currentStepIndex,
            expectedApproverId: currentApproval.approverId.toString(),
            expectedRole: currentApproval.role,
            expectedName: currentApproval.currentApprover,
            actualApproverId: approverId,
            actualRole: manager.role,
            actualName: manager.personal_name,
            idsMatch: currentApproval.approverId.toString() === approverId,
            expectedType: typeof currentApproval.approverId,
            actualType: typeof approverId
        });

        // ✅ Additional debug: Show all approval flow
        console.log("📊 Full Approval Flow:");
        request.approvalFlow.forEach((step, index) => {
            console.log(`  Step ${index + 1}:`, {
                role: step.role,
                approverId: step.approverId.toString(),
                action: step.action,
                approver: step.currentApprover
            });
        });

        // ✅ ID-based authorization check
        if (currentApproval.approverId.toString() !== approverId) {
            console.log("❌ AUTHORIZATION FAILED!");
            console.log("   Expected:", currentApproval.approverId.toString());
            console.log("   Received:", approverId);
            console.log("   Match:", currentApproval.approverId.toString() === approverId);
            
            return res.status(403).json({
                message: `You are not authorized to approve this request at this step. This request is waiting for ${currentApproval.currentApprover} (${currentApproval.role}).`
            });
        }

        console.log("✅ Authorization passed!");

        // ✅ Update approval
        currentApproval.action = action;
        currentApproval.comment = comment || "";
        currentApproval.timestamp = new Date();
        currentApproval.currentApprover = manager.personal_name; // Update with actual approver

        if (action === "Rejected") {
            request.status = "Rejected";
            await request.save();

            console.log("❌ Purchase request", request.requestId, "rejected by", manager.personal_name);

            return res.status(200).json({
                message: "Purchase request rejected.",
                status: "Rejected"
            });
        }

        if (action === "Approved") {
            // ✅ Check if final step
            if (request.currentStep >= request.approvalFlow.length) {
                if (!expectedDeliveryDate) {
                    return res.status(400).json({
                        message: "Expected delivery date is required for final approval."
                    });
                }

                request.status = "Approved";
                request.expectedDeliveryDate = new Date(expectedDeliveryDate);
                await request.save();

                console.log("✅ Purchase request", request.requestId, "fully approved by", manager.personal_name, "with expected delivery date:", request.expectedDeliveryDate);

                return res.status(200).json({
                    message: "Purchase request fully approved.",
                    status: "Approved",
                    expectedDeliveryDate: request.expectedDeliveryDate
                });

            } else {
                // Move to next step
                request.currentStep += 1;
                await request.save();

                const nextApproval = request.approvalFlow[request.currentStep - 1];

                console.log("➡️ Purchase request", request.requestId, "approved by", manager.personal_name, "moving to next approver:", nextApproval.currentApprover);

                return res.status(200).json({
                    message: "Purchase request approved. Moved to next approver.",
                    currentStep: request.currentStep,
                    nextApproval: nextApproval.currentApprover
                });
            }
        }

    } catch (error) {
        res.status(500).json({
            message: "An error occurred while processing the approval: " + error.message
        });
        console.log("❌ Error processing approval:", error);
    }
});



app.get("/purchaseRequests/user/:userId", async (req,res) =>{

    try{
        const {userId} = req.params;

        const requests = await PurchaseRequest.find({requesterId: userId}).populate("requesterId", "personal_name email").populate("approvalFlow.approverId", "personal_name role").sort({createdAt: -1});
        
        res.status(200).json({requests});
        
    } catch(error){
        res.status(500).json({ message: "An error occurred while fetching the purchase requests." + error.message });
        console.log("Error fetching purchase requests:", error);
    }
});



app.get("/purchaseRequests/pending/:managerId", async (req, res) => {
    try {
        const { managerId } = req.params;

        console.log("🔍 Fetching pending approvals for manager ID:", managerId);

        // ✅ Find the manager first
        const manager = await Manager.findById(managerId);
        if (!manager) {
            return res.status(404).json({ message: "Manager not found" });
        }

        console.log("✅ Manager found:", manager.personal_name, "Role:", manager.role);

        // ✅ Find ALL pending requests
        const allPendingRequests = await PurchaseRequest.find({ status: 'Pending' })
            .populate('requesterId', 'personal_name email department')
            .sort({ createdAt: -1 });

        console.log(`📋 Found ${allPendingRequests.length} total pending requests`);

        // ✅ Filter for this manager's role
        const pendingForManager = allPendingRequests.filter(request => {
            const currentApproval = request.approvalFlow[request.currentStep - 1];
            const isForThisManager = currentApproval.role === manager.role && 
                                    currentApproval.action === 'Pending';
            
            if (isForThisManager) {
                console.log(`  ✓ Request ${request.requestId} is pending for ${manager.role}`);
            }
            
            return isForThisManager;
        });

        console.log(`✅ Filtered ${pendingForManager.length} requests for ${manager.role}`);

        // ✅ Return flat array (not wrapped in object)
        res.status(200).json(pendingForManager);

    } catch (error) {
        console.error("❌ Error fetching pending approvals:", error);
        res.status(500).json({
            message: "Error fetching pending requests: " + error.message
        });
    }
});



app.get("/purchaseRequests/:requestId", async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await PurchaseRequest.findOne({ requestId })
            .populate('requesterId', 'personal_name email department office')
            .populate('approvalFlow.approverId', 'personal_name role email');

        if (!request) {
            return res.status(404).json({
                message: "Request not found"
            });
        }

        res.status(200).json({
            request
        });
        console.log("Fetched request:", request);

    } catch (error) {
        res.status(500).json({
            message: "Error fetching request: " + error.message
        });
        console.log("Error fetching request:", error);
    }
});





app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    console.log("Static files served from:", path.join(__dirname, 'uploads'));
});
