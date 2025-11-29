import mongoose from "mongoose";

const purchaseRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true
    },
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ItStaff',
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High']
    },
    estimatedBudget: {
        type: String,
        default: ""
    },
    justification: {
        type: String,
        default: ""
    },
    expectedDeliveryDate: {
        type: Date,
        default: null
    },
    additionalNotes: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    currentStep: {
        type: Number,
        default: 1
    },
    approvalFlow: [{
        approverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Manager',
            required: true
        },
        role: {
            type: String,
            required: true
        },
        action: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        },
        comment: {
            type: String,
            default: ""
        },
        timestamp: {
            type: Date
        },
        currentApprover: {
            type: String,
            required: true
        }
    }]
},
{
    timestamps: true
}
);

export const PurchaseRequest = mongoose.model("PurchaseRequest", purchaseRequestSchema, "purchaseRequests");