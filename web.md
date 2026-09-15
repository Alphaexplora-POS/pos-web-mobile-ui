WHAT THE WEBSITE FRONTEND CONTAINS AND THIS IS ONLY ACCESSABLE WITH ROLE MANAGER AND OWNER:

flowchart TD
    Start([Login: Email + Password - Owner, Branch Manager]) --> Auth{Credentials Verified?}
    Auth -->|Invalid| Retry[Show Error, Retry Login]
    Retry --> Start
    Auth -->|Valid| RLS[(Session Scoped by RLS - Owner: branch_id NULL sees all branches / Branch Manager: branch_id set sees own branch only)]
    RLS --> Nav{Main Navigation Bar - Owner, Branch Manager}

    Nav -->|1. Employees| EmpHub[Employee Accounts - No access: none, both roles enter]
    Nav -->|2. Settings| SetHub[Payment Methods and Reason Codes - No access: Owner]
    Nav -->|3. Product Management| CatHub[Product Management - No access: Owner]
    Nav -->|4. Inventory| InvHub[Global Inventory - No access: Branch Manager]
    Nav -->|5. Promotions| PromoHub[Discount / Promotion Management - No access: Owner]
    Nav -->|6. Analytics| DashHub[Centralized Analytics - No access: Branch Manager]
    Nav -->|7. History| HistHub[Transaction History - Owner, Branch Manager, RLS-scoped]

    %% ===================== EMPLOYEES =====================
    EmpHub --> RoleSelect{Add Employee - Select Role}
    RoleSelect -->|Branch Manager| BMFlow[Enter Name, Assign Branch, Email + Password Invite - Owner only]
    BMFlow --> BMPin[Set Branch Manager PIN - Owner only]
    RoleSelect -->|Supervisor / Cashier / Staff| StaffFlow[Enter Name, Select Role, Set PIN - Branch Manager only, own branch]
    BMPin --> EmpList[(Employee Added)]
    StaffFlow --> EmpList
    EmpList -.->|Add More| RoleSelect

    EmpHub --> EmpDeactivate{Deactivate}
    EmpDeactivate -->|Branch or Branch Manager| OwnerDeactivate[Mark Inactive - Owner only]
    EmpDeactivate -->|Supervisor / Cashier / Staff| BMDeactivate[Mark Inactive - Branch Manager only, own branch]
    OwnerDeactivate --> RecordsKept[(Past Records Kept Visible, Nothing Deleted)]
    BMDeactivate --> RecordsKept
    EmpHub --> EmpReview[Review Employee List - Owner sees all branches, Branch Manager sees own]

    %% ===================== SETTINGS =====================
    SetHub --> PayCRUD[Payment Methods: Add / Edit / Deactivate / Reactivate - Branch Manager only]
    SetHub --> ReasonCRUD[Reason Codes: Add / Edit / Deactivate / Reactivate, Type: Refund or Inventory - Branch Manager only]
    ReasonCRUD -.->|Feeds| PromoHub
    ReasonCRUD -.->|Feeds| InvHub

    %% ===================== PRODUCT MANAGEMENT =====================
    CatHub --> AddCategory[Add Product Category - Branch Manager only]
    AddCategory --> AddProduct[Add Product: Name, Description, Base Price, Image - Branch Manager only]
    AddProduct --> AddVariant[Add Variants: Size, Color, SKU - Branch Manager only]
    AddVariant -.->|Repeat| AddVariant
    AddProduct --> AddAttribute[Add Custom Attributes e.g. Material - Branch Manager only]
    AddAttribute -.->|Repeat| AddAttribute
    CatHub --> EditProduct{Edit, Activate, Deactivate, or Override Cost Price - Branch Manager only}
    EditProduct -->|Edit Details| ProductEdited[(Update Saved)]
    EditProduct -->|Deactivate| ProductInactive[(Marked Inactive)]
    EditProduct -->|Activate| ProductActive[(Marked Active)]
    EditProduct -->|Override cost_price| CostOverride[(Direct Manual Edit, No Stock Movement - Distinct from Weighted-Avg Calc on Mobile Stock-In)]

    %% ===================== GLOBAL INVENTORY =====================
    InvHub --> CombinedStock[View Combined Stock Levels Across All Branches - Owner only]
    InvHub --> GlobalAudit[Global Audit Log: Filter by Branch or Product - Owner only]
    GlobalAudit --> AuditNote[(Aggregated View of Per-Branch Logs Recorded on Mobile - Same Data, No Separate Build)]

    %% ===================== PROMOTIONS =====================
    PromoHub --> PromoScope[Choose Applicable Products or Categories - Branch Manager only]
    PromoScope -.->|Repeat| PromoScope
    PromoScope --> PromoType{Promo Type - Branch Manager only}
    PromoType -->|Percentage| PromoPct[Set % Off, Preview Price - Branch Manager only]
    PromoType -->|Fixed| PromoFixed[Set Fixed Amount Off, Preview Price - Branch Manager only]
    PromoType -->|Bundle| PromoBundle[Set Bundle Rule e.g. Buy 3 for 1000, Preview - Branch Manager only]
    PromoPct --> PromoCombine[Choose if Combinable with Other Promos - Branch Manager only]
    PromoFixed --> PromoCombine
    PromoBundle --> PromoCombine
    PromoCombine --> PromoState{Activate, Schedule, or Deactivate - Branch Manager only}
    PromoState -->|Now| PromoActive[(Promotion Active)]
    PromoState -->|Later| PromoScheduled[(Promotion Scheduled: Start / End Date)]
    PromoState -->|Deactivate| PromoInactive[(Promotion Inactive)]

    %% ===================== ANALYTICS =====================
    DashHub --> DashOwner[Company-wide Dashboard: Sales Today, Sales Monthly, Top Products Pie - Owner only]
    DashHub --> DashCompare[Compare Branches Side by Side, Top Products per Branch - Owner only]

    %% ===================== HISTORY =====================
    HistHub --> TxFilter[Filter: Today / Week / Month / Custom Range - RLS-scoped]
    TxFilter --> TxDetail[View Transaction Details: Items, Discounts, Payment, Timestamp - RLS-scoped]
    TxFilter --> RefundFilter[Refund History: Filter by Date - RLS-scoped]
    TxDetail --> RLSNote[(One Screen, One Query - RLS Restricts Rows by branch_id, No Separate Owner/BM Build)]

    %% ===================== ONBOARDING - Owner only, precedes first Login =====================
    Signup([First-time Owner Signup: Name, Email, Password]) -.->|Creates account, then proceeds to| Start
    Signup -.-> BizSetup[Enter Business Name and Type - Owner only]
    BizSetup -.-> BranchSetup[Set Up First Branch: Name, Address, Contact - Owner only]
    BranchSetup -.->|Then logs in via| Start
