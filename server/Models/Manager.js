import mongoose from "mongoose";

const managerSchema = new mongoose.Schema({
    managerId: {
        type: String,
        required: true,
        unique: true
    },
    personal_name: {
        type: String,
        required: true
    },
    initials: {
        type: String,
        required: true
    },
    national_id: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    mobile_number: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true
    },
    nationality: {
        type: String,
        required: true
    },
    manpower_id: {
        type: String,
        required: true,
        unique: true
    },
    department: {
        type: String,
        required: true
    },
    office: {
        type: String,
        required: true
    },
    office_contact_number: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    academic_qualification: {
        type: String,
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    name_of_university: {
        type: String,
        required: true
    },
    country_of_issue: {
        type: String,
        required: true
    },
    year_of_issue: {
        type: Number,
        required: true
    },
    photoUrl: {
        type: String,
        default: "default_avatar.png"
    },
    isActive: {
        type: Boolean,
        default: true
    }
},{
    timestamps: true
}

);

export const Manager = mongoose.model("Manager", managerSchema,"managers");