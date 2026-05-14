# Digital Requests Portal — Final Database and Backend Instructions

## 1. Purpose of This Document

This document defines the final database naming convention, schema structure, workflow logic, assignment logic, and backend rules for the **Digital Requests Portal**.

The system supports two main categories of services:

1. **Multi-level approval services**
2. **Single-level handler services**

The goal is to keep the system consistent, scalable, and easy to maintain.

---

## 2. Naming Convention

Use **snake_case** for all MongoDB collection names and database field names.

Do **not** mix camelCase and snake_case.

### Correct Collection Names

```text
users
departments
workflow_settings
assignment_rules
purchase_requests
transportation_requests
food_requests
fund_requests
install_software_requests
printing_requests
risk_reports
notifications
```

### Correct Field Naming Style

Use:

```text
request_number
requester_id
requester_name
current_approval_level
approval_history
assigned_to
created_at
updated_at
```

Do not use:

```text
requestNumber
requesterId
requesterName
currentApprovalLevel
createdAt
updatedAt
```

---

## 3. Main System Concept

The system has one unified request idea.

All request types share common fields such as:

```text
request_number
requester_id
requester_name
department
status
current_approval_level
assigned_to
approval_history
attachments
created_at
updated_at
```

However, each request type also has its own specific fields.

The correct design is:

```text
Common request structure + service-specific fields
```

Do not make all schemas completely identical.

---

## 4. Types of Services

## 4.1 Multi-Level Approval Services

These services require more than one approval level.

The multi-level services are:

```text
purchase_requests
transportation_requests
food_requests
fund_requests
```

These services use:

```text
workflow_settings
current_approval_level
assigned_to
approval_history
```

The purpose of `workflow_settings` is to define the approval chain.

Example:

```text
Purchase Request → HOD → Finance
Transportation Request → HOD → AVC → Public Relations
Food Request → HOD → AVC → Finance
Fund Request → Head Academic → Dean → Finance
```

For multi-level services, `assigned_to` means:

```text
The current approver responsible for the request at the current approval level.
```

Example:

```text
Staff submits purchase request
→ assigned_to = HOD
→ HOD approves
→ assigned_to = Finance
→ Finance approves
→ request becomes approved/completed
```

The `approval_history` array stores each approval or rejection action.

Each level can add one record to `approval_history`.

---

## 4.2 Single-Level Handler Services

These services do not need a multi-level approval chain.

The single-level services are:

```text
install_software_requests
printing_requests
risk_reports
```

These services use:

```text
assignment_rules
assigned_to
current_approval_level = 1
approval_history
```

For single-level services, `assigned_to` means:

```text
The handler responsible for processing the request.
```

Example:

```text
Staff submits install software request
→ system checks assignment_rules
→ system assigns request to one IT staff member
→ IT staff processes/completes/rejects the request
```

The `approval_history` array is still used, but it records handler actions instead of multi-level approval steps.

Example:

```json
[
  {
    "level": 1,
    "approver_id": "ObjectId",
    "approver_name": "Khalid Al Balushi",
    "approver_role": "it_staff",
    "action": "in_progress",
    "comments": "Started software installation.",
    "timestamp": "Date"
  },
  {
    "level": 1,
    "approver_id": "ObjectId",
    "approver_name": "Khalid Al Balushi",
    "approver_role": "it_staff",
    "action": "completed",
    "comments": "Software installed successfully.",
    "timestamp": "Date"
  }
]
```

---

## 5. Why `workflow_settings` Is Used for Multi-Level and `assignment_rules` for Single-Level

The two collections answer different questions.

## 5.1 Multi-Level Services Need `workflow_settings`

Multi-level services need to answer this question:

```text
Who approves first, second, third, and so on?
```

Therefore, they use `workflow_settings`.

`workflow_settings` defines:

```text
approval order
approval levels
required roles at each level
timeout days
whether each level is required
```

Example:

```json
{
  "request_type": "purchase",
  "workflow_name": "Purchase Request Approval Workflow",
  "is_active": true,
  "approval_levels": [
    {
      "level": 1,
      "role_name": "hod",
      "is_required": true,
      "timeout_days": 3
    },
    {
      "level": 2,
      "role_name": "finance",
      "is_required": true,
      "timeout_days": 5
    }
  ]
}
```

This tells the backend:

```text
First send the request to HOD.
After HOD approval, send it to Finance.
After Finance approval, complete the request.
```

---

## 5.2 Single-Level Services Need `assignment_rules`

Single-level services do not need an ordered approval chain.

They need to answer this question:

```text
Which specific staff member should handle this request?
```

Therefore, they use `assignment_rules`.

Example:

```json
{
  "service_type": "install_software",
  "target_role": "it_staff",
  "assignment_mode": "least_load",
  "description": "Assign install software requests to the least busy IT staff member.",
  "is_active": true
}
```

This tells the backend:

```text
Find active users with role it_staff.
Choose the correct person based on assignment_mode.
Store that person in assigned_to.
```

---

## 5.3 Can Multi-Level Services Also Use Assignment Rules?

Technically, yes.

In a more advanced system, both collections can work together:

```text
workflow_settings tells the system the next role.
assignment_rules tells the system the exact user inside that role.
```

Example:

```text
Purchase request level 2 requires finance approval.
There are four finance officers.
assignment_rules can choose the least busy finance officer.
```

However, for this project, keep the logic simple:

```text
Multi-level services = workflow_settings
Single-level services = assignment_rules
```

The final selected user is always stored in:

```text
assigned_to
```

---

## 6. Important Rule: Every Request Must Have `assigned_to`

All request collections must include `assigned_to`.

This includes:

```text
purchase_requests
transportation_requests
food_requests
fund_requests
install_software_requests
printing_requests
risk_reports
```

For multi-level requests:

```text
assigned_to = current approver
```

For single-level requests:

```text
assigned_to = assigned handler
```

When a request is fully completed, approved, rejected, resolved, or disbursed, `assigned_to` can become `null`.

---

## 7. Shared Base Request Fields

Every request collection should contain these common fields:

```json
{
  "_id": "ObjectId",
  "request_number": "String (unique, auto-generated)",
  "requester_id": "ObjectId (ref: users, required)",
  "requester_name": "String",
  "department": "ObjectId (ref: departments)",
  "status": "String",
  "current_approval_level": "Number (default: 1)",
  "assigned_to": "ObjectId (ref: users)",
  "approval_history": [
    {
      "level": "Number",
      "approver_id": "ObjectId (ref: users)",
      "approver_name": "String",
      "approver_role": "String",
      "action": "String",
      "comments": "String",
      "timestamp": "Date"
    }
  ],
  "attachments": ["String (URLs)"],
  "created_at": "Date",
  "updated_at": "Date"
}
```

Some services may also include `priority`, `handler_notes`, or completion dates depending on the service type.

---

## 8. Final Collection Schemas

## 8.1 `users`

Use one unified `users` collection instead of separate `itstaff` and `managers` collections.

A user can have one role or multiple roles.

Example:

```text
A user can be staff only.
A user can be staff and HOD.
A user can be finance.
A user can be admin.
```

Schema:

```json
{
  "_id": "ObjectId",
  "email": "String (unique, required)",
  "password": "String (hashed, required)",
  "full_name": "String (required)",
  "initials": "String",
  "manpower_id": "String (unique, required)",
  "national_id": "String (unique, optional)",
  "mobile_number": "String",
  "office_contact_number": "String",
  "office": "String",
  "department": "ObjectId (ref: departments)",
  "specialization": "String",
  "academic_qualification": "String",
  "country_of_issue": "String",
  "year_of_issue": "Number",
  "image_url": "String",
  "roles": ["String"],
  "is_active": "Boolean (default: true)",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Allowed roles:

```text
staff
hod
head_academic
avc
dean
finance
public_relations
it_staff
print_officer
safety_officer
admin
```

Do not use `ceo` unless explicitly added later.

Because this is a university system, use roles like:

```text
hod
head_academic
avc
dean
finance
public_relations
```

not corporate roles like:

```text
ceo
```

---

## 8.2 `departments`

Schema:

```json
{
  "_id": "ObjectId",
  "department_code": "String (unique, required)",
  "department_name": "String (required)",
  "description": "String",
  "head_of_department": "ObjectId (ref: users)",
  "is_active": "Boolean (default: true)",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Stores department information.
Links each department to its HOD.
Used to route requests to the correct department head.
```

Example:

```json
{
  "department_code": "IT",
  "department_name": "Information Technology",
  "description": "IT academic and technical department",
  "head_of_department": "ObjectId",
  "is_active": true
}
```

---

## 8.3 `workflow_settings`

Schema:

```json
{
  "_id": "ObjectId",
  "request_type": "String ('purchase' | 'transportation' | 'food' | 'fund')",
  "workflow_name": "String (required)",
  "is_active": "Boolean (default: true)",
  "approval_levels": [
    {
      "level": "Number",
      "role_name": "String",
      "is_required": "Boolean",
      "timeout_days": "Number"
    }
  ],
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Defines the approval chain for multi-level services.
Controls which role approves at each level.
Allows admin to modify approval flows without changing code.
```

Example for purchase:

```json
{
  "request_type": "purchase",
  "workflow_name": "Purchase Approval Workflow",
  "is_active": true,
  "approval_levels": [
    {
      "level": 1,
      "role_name": "hod",
      "is_required": true,
      "timeout_days": 3
    },
    {
      "level": 2,
      "role_name": "finance",
      "is_required": true,
      "timeout_days": 5
    }
  ]
}
```

---

## 8.4 `assignment_rules`

Schema:

```json
{
  "_id": "ObjectId",
  "service_type": "String ('install_software' | 'printing' | 'risk_report')",
  "target_role": "String ('it_staff' | 'print_officer' | 'safety_officer')",
  "assignment_mode": "String ('round_robin' | 'least_load' | 'department' | 'manual')",
  "description": "String",
  "is_active": "Boolean (default: true)",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Defines how single-level service requests are assigned to handlers.
Used to select a specific staff member responsible for processing the request.
```

Example:

```json
{
  "service_type": "install_software",
  "target_role": "it_staff",
  "assignment_mode": "least_load",
  "description": "Assign software installation requests to the least busy IT staff member.",
  "is_active": true
}
```

Assignment modes:

```text
round_robin  = distribute requests one by one among eligible staff
least_load   = assign to the staff member with the fewest active requests
department   = assign based on department relationship
manual       = admin or coordinator manually selects handler
```

---

## 8.5 `purchase_requests`

Schema:

```json
{
  "_id": "ObjectId",
  "request_number": "String (unique, auto-generated)",
  "requester_id": "ObjectId (ref: users, required)",
  "requester_name": "String",
  "department": "ObjectId (ref: departments)",
  "item_description": "String (required)",
  "quantity": "Number (required)",
  "estimated_cost": "Number (required)",
  "justification": "String (required)",
  "urgency": "String ('low' | 'medium' | 'high')",
  "status": "String ('pending' | 'approved' | 'rejected' | 'completed')",
  "current_approval_level": "Number (default: 1)",
  "assigned_to": "ObjectId (ref: users)",
  "approval_history": [
    {
      "level": "Number",
      "approver_id": "ObjectId (ref: users)",
      "approver_name": "String",
      "approver_role": "String",
      "action": "String ('approved' | 'rejected')",
      "comments": "String",
      "timestamp": "Date"
    }
  ],
  "attachments": ["String (URLs)"],
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Stores purchase requests submitted by staff.
Uses workflow_settings to move through approval levels.
```

---

## 8.6 `transportation_requests`

Schema:

```json
{
  "_id": "ObjectId",
  "request_number": "String (unique, auto-generated)",
  "requester_id": "ObjectId (ref: users, required)",
  "requester_name": "String",
  "department": "ObjectId (ref: departments)",
  "trip_purpose": "String (required)",
  "destination": "String (required)",
  "departure_date": "Date (required)",
  "return_date": "Date (optional)",
  "number_of_passengers": "Number (required)",
  "vehicle_type": "String ('sedan' | 'suv' | 'bus' | 'van')",
  "status": "String ('pending' | 'approved' | 'rejected' | 'completed')",
  "current_approval_level": "Number (default: 1)",
  "assigned_to": "ObjectId (ref: users)",
  "approval_history": [
    {
      "level": "Number",
      "approver_id": "ObjectId (ref: users)",
      "approver_name": "String",
      "approver_role": "String",
      "action": "String ('approved' | 'rejected')",
      "comments": "String",
      "timestamp": "Date"
    }
  ],
  "assigned_vehicle": "String",
  "assigned_driver": "String",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Stores transportation service requests.
Uses workflow_settings for approval.
May later store assigned vehicle and assigned driver.
```

---

## 8.7 `food_requests`

Schema:

```json
{
  "_id": "ObjectId",
  "request_number": "String (unique, auto-generated)",
  "requester_id": "ObjectId (ref: users, required)",
  "requester_name": "String",
  "department": "ObjectId (ref: departments)",
  "event_name": "String (required)",
  "event_date": "Date (required)",
  "event_location": "String (required)",
  "number_of_attendees": "Number (required)",
  "meal_type": "String ('breakfast' | 'lunch' | 'dinner' | 'snacks')",
  "dietary_requirements": "String",
  "estimated_budget": "Number (required)",
  "status": "String ('pending' | 'approved' | 'rejected' | 'completed')",
  "current_approval_level": "Number (default: 1)",
  "assigned_to": "ObjectId (ref: users)",
  "approval_history": [
    {
      "level": "Number",
      "approver_id": "ObjectId (ref: users)",
      "approver_name": "String",
      "approver_role": "String",
      "action": "String ('approved' | 'rejected')",
      "comments": "String",
      "timestamp": "Date"
    }
  ],
  "catering_vendor": "String",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Stores food/catering requests.
Uses workflow_settings for approval.
```

---

## 8.8 `fund_requests`

Schema:

```json
{
  "_id": "ObjectId",
  "request_number": "String (unique, auto-generated)",
  "requester_id": "ObjectId (ref: users, required)",
  "requester_name": "String",
  "department": "ObjectId (ref: departments)",
  "fund_purpose": "String (required)",
  "requested_amount": "Number (required)",
  "currency": "String (default: 'OMR')",
  "justification": "String (required)",
  "budget_code": "String",
  "payment_method": "String ('bank_transfer' | 'cheque' | 'cash')",
  "beneficiary_name": "String",
  "beneficiary_account": "String",
  "status": "String ('pending' | 'approved' | 'rejected' | 'disbursed')",
  "current_approval_level": "Number (default: 1)",
  "assigned_to": "ObjectId (ref: users)",
  "approval_history": [
    {
      "level": "Number",
      "approver_id": "ObjectId (ref: users)",
      "approver_name": "String",
      "approver_role": "String",
      "action": "String ('approved' | 'rejected')",
      "comments": "String",
      "timestamp": "Date"
    }
  ],
  "attachments": ["String (URLs)"],
  "disbursement_date": "Date",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Stores fund requests.
Uses workflow_settings for approval.
Final status can be disbursed instead of completed.
```

---

## 8.9 `install_software_requests`

Schema:

```json
{
  "_id": "ObjectId",
  "request_number": "String (unique, auto-generated)",
  "requester_id": "ObjectId (ref: users, required)",
  "requester_name": "String",
  "department": "ObjectId (ref: departments)",
  "software_name": "String (required)",
  "software_version": "String",
  "license_type": "String",
  "installation_location": "String (required)",
  "machine_identifier": "String",
  "operating_system": "String",
  "priority": "String ('low' | 'medium' | 'high')",
  "requested_date": "Date",
  "preferred_installation_date": "Date",
  "description": "String",
  "attachments": ["String (URLs)"],
  "status": "String ('pending' | 'in_progress' | 'completed' | 'rejected')",
  "current_approval_level": "Number (default: 1)",
  "assigned_to": "ObjectId (ref: users)",
  "approval_history": [
    {
      "level": "Number",
      "approver_id": "ObjectId (ref: users)",
      "approver_name": "String",
      "approver_role": "String",
      "action": "String ('in_progress' | 'completed' | 'rejected')",
      "comments": "String",
      "timestamp": "Date"
    }
  ],
  "handler_notes": "String",
  "installation_completed_at": "Date",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Stores software installation service requests.
Uses assignment_rules to assign the request to an IT staff member.
Does not use multi-level approval.
```

---

## 8.10 `printing_requests`

Schema:

```json
{
  "_id": "ObjectId",
  "request_number": "String (unique, auto-generated)",
  "requester_id": "ObjectId (ref: users, required)",
  "requester_name": "String",
  "department": "ObjectId (ref: departments)",
  "type": "String ('exam' | 'certificate')",
  "priority": "String ('low' | 'medium' | 'high')",
  "requested_date": "Date",
  "required_date": "Date",
  "course_name": "String",
  "course_code": "String",
  "exam_title": "String",
  "orientation": "String ('single' | 'double')",
  "color": "String ('black_white' | 'color')",
  "stapling": "String ('yes' | 'no')",
  "paper_size": "String ('A4' | 'A3' | 'Letter' | 'Other')",
  "pages_per_exam": "Number",
  "sets_count": "Number",
  "total_pages": "Number",
  "number_of_certificates": "Number",
  "certificate_type": "String",
  "event_name": "String",
  "recipients_list_url": "String",
  "exam_file_url": "String",
  "certificate_file_url": "String",
  "additional_files": ["String (URLs)"],
  "status": "String ('pending' | 'in_progress' | 'completed' | 'rejected')",
  "current_approval_level": "Number (default: 1)",
  "assigned_to": "ObjectId (ref: users)",
  "approval_history": [
    {
      "level": "Number",
      "approver_id": "ObjectId (ref: users)",
      "approver_name": "String",
      "approver_role": "String",
      "action": "String ('in_progress' | 'completed' | 'rejected')",
      "comments": "String",
      "timestamp": "Date"
    }
  ],
  "handler_notes": "String",
  "printing_completed_at": "Date",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Stores exam and certificate printing requests.
Uses assignment_rules to assign the request to a print officer.
Does not use multi-level approval.
```

---

## 8.11 `risk_reports`

Schema:

```json
{
  "_id": "ObjectId",
  "request_number": "String (unique, auto-generated)",
  "requester_id": "ObjectId (ref: users, required)",
  "requester_name": "String",
  "department": "ObjectId (ref: departments)",
  "location": "String (required)",
  "category": "String ('safety' | 'facility' | 'compliance' | 'other')",
  "risk_type": "String",
  "description": "String (required)",
  "severity": "String ('low' | 'medium' | 'high' | 'critical')",
  "likelihood": "String ('rare' | 'possible' | 'likely')",
  "reported_at": "Date",
  "incident_date": "Date",
  "evidence_file_url": "String",
  "attachments": ["String (URLs)"],
  "status": "String ('pending' | 'in_progress' | 'resolved' | 'rejected')",
  "current_approval_level": "Number (default: 1)",
  "assigned_to": "ObjectId (ref: users)",
  "approval_history": [
    {
      "level": "Number",
      "approver_id": "ObjectId (ref: users)",
      "approver_name": "String",
      "approver_role": "String",
      "action": "String ('in_progress' | 'resolved' | 'rejected')",
      "comments": "String",
      "timestamp": "Date"
    }
  ],
  "risk_assessment": "String",
  "mitigation_actions": "String",
  "resolved_by": "ObjectId (ref: users)",
  "resolved_at": "Date",
  "resolution_notes": "String",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Stores risk and safety reports.
Uses assignment_rules to assign the report to a safety officer.
Does not use multi-level approval.
```

---

## 8.12 `notifications`

Schema:

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users, required)",
  "request_id": "ObjectId (required)",
  "request_type": "String",
  "title": "String",
  "message": "String",
  "is_read": "Boolean (default: false)",
  "created_at": "Date",
  "updated_at": "Date"
}
```

Purpose:

```text
Stores notifications for users.
Used when a request is submitted, assigned, approved, rejected, completed, resolved, or disbursed.
```

---

## 9. Status Values

Use consistent status values.

## 9.1 Multi-Level Services

For `purchase_requests`, `transportation_requests`, and `food_requests`:

```text
pending
approved
rejected
completed
```

For `fund_requests`:

```text
pending
approved
rejected
disbursed
```

## 9.2 Single-Level Services

For `install_software_requests` and `printing_requests`:

```text
pending
in_progress
completed
rejected
```

For `risk_reports`:

```text
pending
in_progress
resolved
rejected
```

Do not create too many different status names unless necessary.

---

## 10. Backend Logic

## 10.1 Creating a Multi-Level Request

Applies to:

```text
purchase_requests
transportation_requests
food_requests
fund_requests
```

Steps:

```text
1. Validate user authentication.
2. Validate request body.
3. Generate unique request_number.
4. Get requester information from logged-in user.
5. Set requester_id.
6. Set requester_name.
7. Set department from requester profile.
8. Set status = pending.
9. Set current_approval_level = 1.
10. Load active workflow_settings for the request type.
11. Get approval level 1.
12. Determine the approver role.
13. Find the correct approver user.
14. Set assigned_to = approver user id.
15. Save the request.
16. Create notification for assigned approver.
17. Return created request.
```

Important:

```text
If level 1 role is hod, find the HOD from the requester's department.
If level 1 role is finance, find an active user with finance role.
If level 1 role is dean, find an active user with dean role.
```

---

## 10.2 Approving a Multi-Level Request

Steps:

```text
1. Validate user authentication.
2. Find the request by id.
3. Check that request is not already completed/rejected/disbursed.
4. Check that logged-in user id equals assigned_to.
5. Add approval action to approval_history.
6. Load active workflow_settings for the request type.
7. Check if there is another approval level.
8. If next level exists:
   - Increment current_approval_level.
   - Find next approver by role.
   - Set assigned_to = next approver id.
   - Keep status = pending.
   - Notify next approver.
9. If no next level exists:
   - Set status = approved/completed/disbursed depending on service type.
   - Set assigned_to = null.
   - Notify requester.
10. Save request.
11. Return updated request.
```

---

## 10.3 Rejecting a Multi-Level Request

Steps:

```text
1. Validate user authentication.
2. Find the request by id.
3. Check that logged-in user id equals assigned_to.
4. Add rejection action to approval_history.
5. Set status = rejected.
6. Set assigned_to = null.
7. Save request.
8. Notify requester.
9. Return updated request.
```

---

## 10.4 Creating a Single-Level Request

Applies to:

```text
install_software_requests
printing_requests
risk_reports
```

Steps:

```text
1. Validate user authentication.
2. Validate request body.
3. Generate unique request_number.
4. Get requester information from logged-in user.
5. Set requester_id.
6. Set requester_name.
7. Set department from requester profile.
8. Set status = pending.
9. Set current_approval_level = 1.
10. Load active assignment_rules for the service type.
11. Get target_role from assignment_rules.
12. Find eligible active users with that role.
13. Select handler based on assignment_mode.
14. Set assigned_to = selected handler id.
15. Save request.
16. Create notification for assigned handler.
17. Return created request.
```

---

## 10.5 Handler Updates a Single-Level Request

Steps:

```text
1. Validate user authentication.
2. Find the request by id.
3. Check that logged-in user id equals assigned_to.
4. Update status according to allowed values.
5. Add action to approval_history.
6. Save handler_notes if provided.
7. If completed/resolved/rejected:
   - Set completed/resolved date if needed.
   - Set assigned_to = null if no further action is needed.
8. Notify requester.
9. Save request.
10. Return updated request.
```

---

## 11. Role-Based Access Control

## 11.1 Staff User

A user with role `staff` can:

```text
create requests
view own requests
track own request status
receive notifications
```

## 11.2 Approver Roles

Approver roles include:

```text
hod
head_academic
avc
dean
finance
public_relations
```

Approvers can:

```text
view requests assigned to them
approve assigned requests
reject assigned requests
add comments
view approval history
```

An approver must only approve or reject a request if:

```text
logged_in_user._id == request.assigned_to
```

## 11.3 Handler Roles

Handler roles include:

```text
it_staff
print_officer
safety_officer
```

Handlers can:

```text
view requests assigned to them
update request status
add handler notes
complete or reject assigned requests
```

A handler must only update a request if:

```text
logged_in_user._id == request.assigned_to
```

## 11.4 Admin Role

Admin can:

```text
create users
edit users
deactivate users
assign roles
create departments
assign HOD to departments
create workflow_settings
edit workflow_settings
create assignment_rules
edit assignment_rules
view all requests
view reports/statistics
```

Users should not self-register.

User accounts should be created by admin.

---

## 12. Request Number Format

Generate readable unique request numbers.

Recommended examples:

```text
PUR-2026-0001
TRN-2026-0001
FOD-2026-0001
FND-2026-0001
SW-2026-0001
PRN-2026-0001
RSK-2026-0001
```

Suggested prefixes:

```text
purchase_requests = PUR
transportation_requests = TRN
food_requests = FOD
fund_requests = FND
install_software_requests = SW
printing_requests = PRN
risk_reports = RSK
```

---

## 13. Recommended API Structure

## 13.1 Authentication APIs

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## 13.2 User APIs

```text
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

Only admin should create/update/delete users.

---

## 13.3 Department APIs

```text
GET    /api/departments
GET    /api/departments/:id
POST   /api/departments
PUT    /api/departments/:id
DELETE /api/departments/:id
```

Only admin should create/update/delete departments.

---

## 13.4 Workflow Settings APIs

```text
GET    /api/workflow-settings
GET    /api/workflow-settings/:id
POST   /api/workflow-settings
PUT    /api/workflow-settings/:id
DELETE /api/workflow-settings/:id
```

Only admin should manage workflow settings.

---

## 13.5 Assignment Rules APIs

```text
GET    /api/assignment-rules
GET    /api/assignment-rules/:id
POST   /api/assignment-rules
PUT    /api/assignment-rules/:id
DELETE /api/assignment-rules/:id
```

Only admin should manage assignment rules.

---

## 13.6 Multi-Level Request APIs

Use similar route patterns for each multi-level request type.

Example for purchase:

```text
GET  /api/purchase-requests
GET  /api/purchase-requests/my
GET  /api/purchase-requests/assigned-to-me
GET  /api/purchase-requests/:id
POST /api/purchase-requests
PUT  /api/purchase-requests/:id/approve
PUT  /api/purchase-requests/:id/reject
```

Repeat similar structure for:

```text
transportation-requests
food-requests
fund-requests
```

---

## 13.7 Single-Level Request APIs

Example for install software:

```text
GET  /api/install-software-requests
GET  /api/install-software-requests/my
GET  /api/install-software-requests/assigned-to-me
GET  /api/install-software-requests/:id
POST /api/install-software-requests
PUT  /api/install-software-requests/:id/status
PUT  /api/install-software-requests/:id/reject
```

Repeat similar structure for:

```text
printing-requests
risk-reports
```

For risk reports, status update can include:

```text
in_progress
resolved
rejected
```

---

## 14. Required Backend Helper Functions

Create reusable helper functions to avoid repeating logic.

## 14.1 Request Number Generator

```text
generate_request_number(request_type)
```

Purpose:

```text
Generates unique request numbers such as PUR-2026-0001.
```

---

## 14.2 Find Next Approver

```text
find_next_approver(request, role_name)
```

Purpose:

```text
Finds the correct approver for a multi-level request.
```

Rules:

```text
If role_name = hod, use department.head_of_department.
If role_name = finance, find active user with finance role.
If role_name = dean, find active user with dean role.
If role_name = avc, find active user with avc role.
If role_name = public_relations, find active user with public_relations role.
```

---

## 14.3 Assign Handler

```text
assign_handler(service_type, requester_department)
```

Purpose:

```text
Uses assignment_rules to select a handler for single-level services.
```

Rules:

```text
Load active assignment_rules by service_type.
Find active users with target_role.
Select user based on assignment_mode.
Return selected user id.
```

---

## 14.4 Add Approval History

```text
add_approval_history(request, user, action, comments)
```

Purpose:

```text
Adds a history record to approval_history.
```

The record should include:

```text
level
approver_id
approver_name
approver_role
action
comments
timestamp
```

---

## 14.5 Create Notification

```text
create_notification(user_id, request_id, request_type, title, message)
```

Purpose:

```text
Creates a notification for a user.
```

---

## 15. Validation Rules

## 15.1 User Validation

Required fields:

```text
email
password
full_name
manpower_id
roles
```

Validation:

```text
email must be unique
manpower_id must be unique
national_id should be unique if provided
password must be hashed before saving
roles must use allowed role names only
is_active defaults to true
```

---

## 15.2 Request Validation

All requests must validate:

```text
requester_id exists
requester is active
requester has valid department
status uses allowed values
assigned_to references valid active user when assigned
```

---

## 15.3 Workflow Validation

For `workflow_settings`:

```text
request_type must be unique when active
approval_levels must not be empty
level numbers should be ordered
role_name must be a valid role
only one active workflow per request_type is recommended
```

---

## 15.4 Assignment Rule Validation

For `assignment_rules`:

```text
service_type must be valid
target_role must be valid
assignment_mode must be valid
only one active assignment rule per service_type is recommended
```

---

## 16. Recommended Indexes

Use indexes to improve performance.

## 16.1 Users

```text
email unique
manpower_id unique
national_id unique sparse
roles
department
is_active
```

## 16.2 Departments

```text
department_code unique
head_of_department
is_active
```

## 16.3 Requests

For every request collection:

```text
request_number unique
requester_id
assigned_to
status
created_at
department
```

## 16.4 Workflow Settings

```text
request_type
is_active
```

## 16.5 Assignment Rules

```text
service_type
is_active
```

---

## 17. Important Security Rules

```text
Never store plain text passwords.
Always hash passwords.
Use JWT or secure session authentication.
Protect admin routes.
Protect approver routes.
Protect handler routes.
Only assigned users can approve/reject/update assigned requests.
Validate uploaded file types and sizes.
Do not trust requester_name from frontend; derive it from authenticated user.
Do not trust department from frontend; derive it from authenticated user unless admin is creating on behalf of someone.
```

---

## 18. Frontend Integration Expectations

The frontend should send only request-specific data.

The backend should automatically set:

```text
request_number
requester_id
requester_name
department
status
current_approval_level
assigned_to
created_at
updated_at
```

Example: when creating a purchase request, frontend sends:

```json
{
  "item_description": "New laboratory computers",
  "quantity": 10,
  "estimated_cost": 3500,
  "justification": "Needed for computer lab upgrade",
  "urgency": "high",
  "attachments": []
}
```

Backend adds:

```text
request_number
requester_id
requester_name
department
status
current_approval_level
assigned_to
approval_history
created_at
updated_at
```

---

## 19. Example End-to-End Scenarios

## 19.1 Multi-Level Purchase Request Scenario

```text
1. Ahmed logs in as staff.
2. Ahmed submits a purchase request.
3. Backend creates request_number PUR-2026-0001.
4. Backend loads workflow_settings for purchase.
5. Level 1 role is hod.
6. Backend finds Ahmed's department HOD.
7. Request assigned_to = HOD user id.
8. HOD receives notification.
9. HOD approves.
10. Backend adds HOD approval to approval_history.
11. Backend checks next level.
12. Level 2 role is finance.
13. Backend assigns request to Finance.
14. Finance receives notification.
15. Finance approves.
16. Backend adds Finance approval to approval_history.
17. No more levels exist.
18. Request status becomes approved or completed.
19. assigned_to becomes null.
20. Ahmed receives notification.
```

---

## 19.2 Single-Level Install Software Scenario

```text
1. Ahmed logs in as staff.
2. Ahmed submits install software request.
3. Backend creates request_number SW-2026-0001.
4. Backend loads assignment_rules for install_software.
5. Rule target_role = it_staff.
6. Rule assignment_mode = least_load.
7. Backend finds all active IT staff users.
8. Backend selects the least busy IT staff member.
9. Request assigned_to = selected IT staff user id.
10. IT staff receives notification.
11. IT staff changes status to in_progress.
12. Backend adds action to approval_history.
13. IT staff completes installation.
14. Backend changes status to completed.
15. Backend adds completed action to approval_history.
16. assigned_to becomes null.
17. Ahmed receives notification.
```

---

## 19.3 Single-Level Risk Report Scenario

```text
1. Staff submits risk report.
2. Backend creates request_number RSK-2026-0001.
3. Backend loads assignment_rules for risk_report.
4. Rule target_role = safety_officer.
5. Backend assigns report to safety officer.
6. Safety officer receives notification.
7. Safety officer sets status to in_progress.
8. Safety officer writes risk_assessment.
9. Safety officer adds mitigation_actions.
10. Safety officer resolves the report.
11. Status becomes resolved.
12. resolved_by = safety officer id.
13. resolved_at = current date.
14. assigned_to becomes null.
15. Requester receives notification.
```

---

## 20. Final Implementation Summary

The final design should follow this rule:

```text
All requests share the same common structure.
Each request has its own service-specific fields.
All requests have assigned_to.
All requests have approval_history.
Multi-level services use workflow_settings.
Single-level services use assignment_rules.
```

The key difference is:

```text
Multi-level services ask: Who approves next?
Single-level services ask: Who should handle this request?
```

Therefore:

```text
workflow_settings = approval chain
assignment_rules = handler selection
assigned_to = currently responsible user
approval_history = record of actions
```

Keep all database names and fields in snake_case.

Do not create separate `managers` or `itstaff` collections.

Use one unified `users` collection with roles.

Admin controls users, departments, workflow settings, and assignment rules.

Users do not self-register.

The backend should not trust frontend-submitted requester identity fields.

The backend should derive requester identity from the authenticated logged-in user.