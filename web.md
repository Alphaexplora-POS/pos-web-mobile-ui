WHAT THE WEBSITE FRONTEND CONTAINS AND THIS IS ONLY ACCESSABLE WITH ROLE MANAGER AND OWNER:

flowchart TD

    SignupStart(["First-time Owner Signup: Name, Email, Password"]) --> ValidateSignup{"Validate Input - required fields, valid email, password rules"}
    ValidateSignup -->|"Invalid"| SignupError["Show Error, Retry Signup"]
    SignupError --> SignupStart
    ValidateSignup -->|"Valid"| CreateAccount[("Owner Account Created")]

    CreateAccount --> BizSetup["Enter Business Name and Type"]
    BizSetup --> ValidateBiz{"Validate Business Details"}
    ValidateBiz -->|"Invalid"| BizError["Show Error, Retry"]
    BizError --> BizSetup
    ValidateBiz -->|"Valid"| CreateWorkspace[("Business Workspace Created")]

    CreateWorkspace --> BranchSetup["Set Up First Branch: Name, Address, Contact"]
    BranchSetup --> ValidateBranch{"Validate Branch Details"}
    ValidateBranch -->|"Invalid"| BranchError["Show Error, Retry"]
    BranchError --> BranchSetup
    ValidateBranch -->|"Valid"| BranchCreated[("Branch Created")]

    BranchCreated --> LoginStart

    LoginStart(["Login: Email + Password - Owner, Branch Manager"]) --> Auth{"Credentials Verified?"}
    Auth -->|"Invalid"| Retry["Show Error, Retry Login"]
    Retry --> LoginStart
    Auth -->|"Valid"| RLS[("Session Scoped by RLS - Access: Owner sees all branches, Branch Manager sees own branch only")]

    RLS --> Nav{"Main Navigation - 6 Pages"}

    Nav -->|"1. Branch and Employees"| EmpHub["Branch and Employees - Access: Owner, Branch Manager"]
    Nav -->|"2. Product Management"| CatHub["Product Management - Access: Owner, Branch Manager"]
    Nav -->|"3. Global Inventory"| InvHub["Global Inventory - Access: Owner, Branch Manager"]
    Nav -->|"4. Transaction History"| HistHub["Transaction History - Access: Owner, Branch Manager"]
    Nav -->|"5. Centralized Analytics"| DashHub["Centralized Analytics - Access: Owner, Branch Manager"]
    Nav -->|"6. Configuration"| SetHub["Configuration: Payment Methods and Reason Codes - Access: Owner, Branch Manager"]

    EmpHub --> BranchAction{"Branch Actions - Access: Owner only"}
    BranchAction --> CreateBranch["Create or Edit Branch: Name, Address, Contact - Access: Owner only"]
    CreateBranch --> BranchSaved[("Branch Saved")]

    EmpHub --> RoleSelect{"Add Employee - Select Role"}
    RoleSelect -->|"Role: Branch Manager"| BMFlow["Enter Name, Assign Branch, Email plus Password Invite - Access: Owner only"]
    BMFlow --> BMPin["Set Branch Manager PIN - Access: Owner only"]
    RoleSelect -->|"Role: Cashier or Staff"| StaffFlow["Enter Name, Select Role, Set PIN - Access: Owner any branch, Branch Manager own branch only"]
    BMPin --> EmpList[("Employee Added")]
    StaffFlow --> EmpList
    EmpList -.->|"Add More"| RoleSelect

    EmpHub --> EmpDeactivate{"Deactivate"}
    EmpDeactivate -->|"Target: Branch or Branch Manager"| OwnerDeactivate["Mark Inactive - Access: Owner only"]
    EmpDeactivate -->|"Target: Cashier or Staff"| BMDeactivate["Mark Inactive - Access: Owner any branch, Branch Manager own branch"]
    OwnerDeactivate --> RecordsKept[("Past Records Kept Visible, Nothing Deleted")]
    BMDeactivate --> RecordsKept
    EmpHub --> EmpReview["Review Employee List - Access: Owner sees all branches, Branch Manager sees own"]

    CatHub --> AddCategory["Add Product Category - Access: Owner any branch, Branch Manager own branch"]
    AddCategory --> CategoryType{"Category Type"}
    CategoryType -->|"Parent - top-level"| CategorySaved[("Category Created")]
    CategoryType -->|"Child - under existing category"| SelectParent["Select Parent Category"]
    SelectParent --> CategorySaved

    CategorySaved --> AddProduct["Add Product: Name, Description, Base Price, Image - Access: Owner only"]
    AddProduct --> ProductSaved[("Product Created")]

    ProductSaved --> AddVariant["Add Variant: Size, Color, SKU - Access: Owner any branch, Branch Manager own branch"]
    AddVariant --> AutoInventoryLink["Auto-creates linked branch_inventory record, quantity 0 - see Global Inventory, Stock Origin section"]
    AutoInventoryLink -.->|"Feeds"| StockOrigin
    AddVariant --> VariantPricing["Set cost_price and or price_override for this variant - Access: Owner only, optional, not gated by stock quantity"]
    VariantPricing --> PricingSaved[("Pricing Saved")]
    AddVariant -.->|"Repeat for more variants"| AddVariant

    ProductSaved --> AddAttribute["Add Custom Attributes, example Material - Access: Owner any branch, Branch Manager own branch"]
    AddAttribute -.->|"Repeat"| AddAttribute

    CatHub --> EditProduct{"Edit, Activate, or Deactivate Product or Variant"}
    EditProduct -->|"Edit Size, Color, SKU, or Attribute - pricing fields not shown"| ProductEdited[("Update Saved - Access: Owner any branch, Branch Manager own branch")]
    EditProduct -->|"Deactivate"| ProductInactive[("Marked Inactive - Access: Owner any branch, Branch Manager own branch")]
    EditProduct -->|"Activate"| ProductActive[("Marked Active - Access: Owner any branch, Branch Manager own branch")]
    EditProduct -->|"Edit Cost Price or Price Override"| CostOverride[("Direct Manual Edit, No Stock Movement - Access: Owner only. Distinct from Weighted-Avg Calc on Mobile Stock-In")]

    CatHub --> PromoSection["Promotions - Access: Owner any branch, Branch Manager own branch"]
    PromoSection --> PromoScope["Choose Applicable Products or Categories"]
    PromoScope -.->|"Repeat"| PromoScope
    PromoScope --> PromoType{"Promo Type"}
    PromoType -->|"Percentage"| PromoPct["Set Percent Off, Preview Price"]
    PromoType -->|"Fixed"| PromoFixed["Set Fixed Amount Off, Preview Price"]
    PromoType -->|"Bundle"| PromoBundle["Set Bundle Rule, example Buy 3 for 1000, Preview"]
    PromoPct --> PromoCombine["Choose if Combinable with Other Promos"]
    PromoFixed --> PromoCombine
    PromoBundle --> PromoCombine
    PromoCombine --> PromoState{"Activate, Schedule, or Deactivate"}
    PromoState -->|"Now"| PromoActive[("Promotion Active")]
    PromoState -->|"Later"| PromoScheduled[("Promotion Scheduled: Start and End Date")]
    PromoState -->|"Deactivate"| PromoInactive[("Promotion Inactive")]

    InvHub --> StockOrigin{"Stock Origin - how a branch_inventory row came to exist"}
    StockOrigin -->|"Automatic - New Variant Created"| AutoStock["Auto-generated row at quantity 0 - Origin: Product Management page, not a manual Inventory action"]
    StockOrigin -->|"Manual - Add, Edit, Remove, or Transfer Stock"| ManualStock["Manual Stock Actions - Mobile App only - Access: Branch Manager, own branch"]
    AutoStock --> InvView
    ManualStock --> InvView

    InvView{"View Stock - Actor"}
    InvView -->|"Owner"| CombinedStock["View Combined Stock Levels Across All Branches, plus per-branch drilldown - Access: Owner only"]
    InvView -->|"Branch Manager"| OwnStock["View Stock Levels for Own Branch Only - Access: Branch Manager, read-only on Web"]
    CombinedStock --> GlobalAudit["Audit Log: Filter by Branch or Product - Access: Owner sees all branches"]
    OwnStock --> BranchAudit["Audit Log: Filter by Product - Access: Branch Manager sees own branch only"]
    GlobalAudit --> AuditNote[("Aggregated View of Per-Branch Logs Recorded on Mobile - Same Data, No Separate Build")]
    BranchAudit --> AuditNote

    DashHub --> DashView{"Actor"}
    DashView -->|"Owner"| DashOwner["Company-wide Dashboard: Sales Today, Sales Monthly, Top Products Pie, plus Compare Branches Side by Side - Access: Owner only"]
    DashView -->|"Branch Manager"| DashOwnBranch["Own Branch Dashboard: Sales Today, Sales Monthly, Top Products Pie - Access: Branch Manager"]

    HistHub --> TxFilter["Filter: Today, Week, Month, or Custom Range - Access: Owner all branches, Branch Manager own branch, RLS-scoped"]
    TxFilter --> TxDetail["View Transaction Details: Items, Discounts, Payment, Timestamp - Access: Owner all branches, Branch Manager own branch, RLS-scoped"]
    TxFilter --> RefundFilter["Refund History: Filter by Date - Access: Owner all branches, Branch Manager own branch, RLS-scoped"]
    TxDetail --> RLSNote[("One Screen, One Query - RLS Restricts Rows by branch_id, No Separate Owner or Branch Manager Build")]

    SetHub --> PayCRUD["Payment Methods: Add, Edit, Deactivate, Reactivate - Access: Owner any branch, Branch Manager own branch"]
    SetHub --> ReasonCRUD["Reason Codes: Add, Edit, Deactivate, Reactivate, Type Refund or Inventory - Access: Owner any branch, Branch Manager own branch"]
    ReasonCRUD -.->|"Feeds"| PromoType
    ReasonCRUD -.->|"Feeds"| StockOrigin
