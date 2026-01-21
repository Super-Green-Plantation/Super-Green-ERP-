=============================================
                    Branch  
=============================================
POST /api/src/branches ------> branch
GET /api/src/branches ------> branchs, members,position
GET /api/src/branches/[id] ------> branch [id], members,position
PUT /api/src/branches/[id] ------> branch [id], members,position
DELETE /api/src/branches/[id] ------> branch [id] if members availble , delete members first

=============================================
                    Employee  
=============================================
### POST
GET /api/src/branches/[id]/employee ------> employees[] , position
### PUT
### DELETE
=============================================
                    Clients  
=============================================
POST /api/src/clients ------> clients
GET /api/src/clients ------> client, beneficiary,nominee,investments,branch
GET /api/src/clients/[id] ------> client [id], beneficiary,nominee,investments,branch
GET /api/src/clients/by-branch/[branchId] ------> clients,branch,investments
### PUT
### DELETE
=============================================
                    Commission  
=============================================
GET /api/src/commissions/eligible/[empNo]/[branchId] ------> eligible members
=============================================
                    investments  
=============================================
### POST
GET /api/src/invest/[id] ------> plan [id]
### PUT
=============================================
                    Employee  
=============================================
### POST
GET /api/src/members/[branchId] ------> branch [id] members
GET /api/src/members/by-code/[empCode] ------> employee
### PUT
=============================================
                    Plan  
=============================================
### POST
GET /api/src/plans ------> plans
### PUT