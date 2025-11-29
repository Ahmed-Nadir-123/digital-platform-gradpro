import mongoose from "mongoose";

const workflowSettingsSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    steps: [{
        sequence_value: {
            type: Number,
            required: true
        },
        role: {
            type: String,
            required: true
        },
        approverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Manager',  // it should matche the model name
            required: true
        }
    }]
},{
    timestamps: true
}

);

export const WorkflowSettings = mongoose.model("WorkflowSettings", workflowSettingsSchema, "workflowSettings");