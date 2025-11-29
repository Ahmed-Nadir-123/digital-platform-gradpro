import mongoose from "mongoose";

const itStaffSchema = new mongoose.Schema({
    ItStaffId: {
        type: String,
        required: true,
        unique: true
    },
    personal_name:{
        type: String,
        required: true
    },
    initials:{
        type: String,
        required: true
    },
    national_id:{
        type: String,
        required: true,
        unique: true
    },
    manpower_id:{
        type: String,
        required: true,
        unique: true
    },
    gender:{
        type: String,
        required: true
    },
    nationality:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    mobile_number:{
        type: String,
        required: true,
    },
    department:{
        type: String,
        required: true
    },
    office:{
        type: String,
        required: true
    },
    office_contact_number:{
        type: String,
        required: true
    },
    academic_qualification:{
        type: String,
        required: true
    },
    year_of_issue:{
        type: Number,
        required: true
    },
    specialization:{
        type: String,
        required: true
    },
    name_of_university:{
        type: String,
        required: true
    },
    country_of_issue:{
        type: String,
        required: true
    },
    photoUrl:{
        type: String,
        default: ""
    }
},
{
    timestamps: true
}
);

export const ItStaff = mongoose.model("ItStaff", itStaffSchema, "itStaff");