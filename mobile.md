WHAT THE MOBILE FRONTEND CONTAINS: 

flowchart TD
    Start([Employee Enters PIN - All Roles]) --> Auth{PIN Verified?}
    Auth -->|Invalid| Retry[Show Error, Retry PIN]
    Retry --> Start
    Auth -->|Valid| Nav{Main Navigation Bar - All Roles}

    Nav -->|1 POS| POSHub[POS Hub - No access: Staff]
    Nav -->|2 History| HistHub[History Hub - All Roles]
    Nav -->|3 Dashboard| DashHub[Dashboard - No access: Cashier, Staff]
    Nav -->|4 Inventory| InvHub[Inventory Hub - No access: Cashier, Staff]
    Nav -->|5 Close Shift| CloseCheck{Check for Unsynced Transactions - All Roles}

    CloseCheck -->|None pending| ConfirmClose[Confirm Shift Closure - All Roles]
    ConfirmClose --> SessionClosed[(Session Marked Closed - System)]

    CloseCheck -->|Pending found| ShowPending[Show List of Pending/Cached Transactions - Closing Blocked]
    ShowPending --> ForceSync[Sync Now - All Roles]

    POSHub --> AddCart[Add Items to Cart - Cashier only]
    AddCart --> EditCart[Edit Cart: Remove Item / Change Qty - Cashier only]
    EditCart --> Checkout[Finalize Cart for Checkout - Cashier only]
    Checkout --> Discount{Apply Discount or Promo? - Cashier only}
    Discount -->|Bundle| DiscAuto[Bundle Promo Auto-Applied - System]
    Discount -->|Manual| DiscManual[Cashier Enters New Total - Cashier only]
    Discount -->|Percentage| DiscPct[Apply % to Eligible Product - Cashier only]
    Discount -->|None| PayMethod{Payment Method - Cashier only}
    DiscAuto --> PayMethod
    DiscManual --> PayMethod
    DiscPct --> PayMethod
    PayMethod -->|Cash| CashPay[Enter Cash Received, Show Change - Cashier only]
    PayMethod -->|Online| OnlinePay[Enter Receipt/Reference No. - Cashier only, No Gateway]
    CashPay --> ConnCheck{Online?}
    OnlinePay --> ConnCheck
    ConnCheck -->|No| Cache[(Cache Transaction Locally - System)]
    ConnCheck -->|Yes| SyncNow[Sync to Server - System]
    Cache -.->|Connection Restored| SyncNow
    SyncNow --> ReceiptOut[Print / Show Receipt - Cashier only]
    ForceSync --> SyncNow
    SyncNow -.->|After Force Sync| CloseCheck

    POSHub --> InitRefund[Initiate Refund: Look Up Original Transaction - Cashier only]
    InitRefund --> RefundApproval{Approve or Deny Refund - Supervisor, Branch Manager only}
    RefundApproval -->|Approved| CompleteRefund[Complete Refund or Exchange - Cashier only]
    RefundApproval -->|Denied| POSHub
    CompleteRefund --> Restock{Item Restockable?}
    Restock -->|Yes| AddBackStock[(Add Back to Branch Inventory - System)]
    Restock -->|No| WriteOff[(Mark as Written Off - System)]

    HistHub --> TxHistory[Transaction History: Today / Week / Month / Custom - All Roles]
    TxHistory --> TxDetail[View Transaction Details - All Roles]
    HistHub --> RefundHistory[Refund History: Filter by Date - No access: Cashier, Staff]

    DashHub --> DashContent[Branch Sales Today, Sales Monthly, Top Products Pie Chart - Supervisor, Branch Manager only]

    InvHub --> ViewStock[View Branch Stock Levels - Supervisor, Branch Manager only]
    InvHub --> ManageStock{Select Action - Supervisor, Branch Manager only}
    ManageStock -->|Stock In| StockIn[Enter Qty, Reason - Supervisor, Branch Manager only]
    ManageStock -->|Adjustment| StockAdj[Enter Corrected Qty, Reason - Supervisor, Branch Manager only]
    ManageStock -->|Stock Out| StockOut[Enter Reason for Removal - Supervisor, Branch Manager only]
    StockIn --> AuditTrail[(Logged to Branch Audit Trail - System)]
    StockAdj --> AuditTrail
    StockOut --> AuditTrail
