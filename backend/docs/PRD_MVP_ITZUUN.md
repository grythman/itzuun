# ITZuun MVP PRD (Монгол IT Freelance Marketplace)

## 1) Product Overview
**Product name (working):** ITZuun  
**Version:** MVP v1 (Web only)  
**Market:** Монгол дотоод зах зээл (B2B + B2C)

ITZuun нь байгууллага, хувь хүнд найдвартай IT freelancer олох, freelancer-д баталгаатай төлбөртэй ажил хийх орчин үүсгэнэ.

## 2) Problem Statement
Одоогийн хэрэглэгчийн зан төлөв:
- “Танил IT байна уу?” гэж хувийн сүлжээгээр хайдаг
- Facebook/Messenger дээр scope тодорхойгүйгээр ажил эхэлдэг
- Урьдчилгаа алдах, ажил тасрах эрсдэл өндөр
- Гэрээ, нотолгоо, dispute mediation сул

## 3) Target Users
### Client
- ЖДҮ, стартап
- Дэлгүүр, ресторан
- Байгууллага, ТББ
- Хувь хүн (website/system хийлгэх)

### Freelancer
- Web developer
- System/POS developer
- IT support
- Network/server engineer
- Automation/Python
- ERP/1C/CRM specialist

### Internal
- Admin (trust & transaction governance)

## 4) MVP Goals (90 хоног)
- 50+ verified freelancer
- 30+ posted projects
- 10+ completed escrow transactions
- 80%+ reviews with rating >= 4

## 5) Core Value Proposition
- Монгол хэл дээрх IT үйлчилгээний marketplace
- Escrow-той, admin mediation-тэй аюулгүй гүйлгээ
- Project-based стандарт урсгал (post -> proposal -> escrow -> delivery -> review)

## 6) In-Scope (MVP)
1. Role-based auth: client/freelancer/admin  
2. Project posting & browsing  
3. Proposal submission & selection  
4. Project chat + file upload  
5. Escrow lifecycle (deposit/approve/release/refund/dispute)  
6. Review & rating  
7. Admin ops: verify users, dispute resolve, commission setting

## 7) Out-of-Scope (MVP)
- Mobile app
- AI matching/recommendation
- Realtime socket infra (polling acceptable in MVP)
- Fully automated payment gateway settlement (QPay phase 2)

## 8) Non-Functional Requirements
- API-first backend (Django + DRF)
- PostgreSQL compatible schema
- Clear role permissions
- Audit-friendly ledger for escrow operations
- Basic security: JWT auth, ownership checks, input validation

## 9) Risks and Mitigation
- **Trust adoption risk:** verified badge + admin moderation + review transparency
- **Payment ops overhead:** admin-approval escrow process in MVP
- **Scope creep:** maintain strict MVP boundaries (Web only, project-based only)

## 10) Acceptance Criteria (MVP Exit)
- Client can post project and select freelancer
- Freelancer can submit proposal and deliver result
- Escrow can be deposited, admin-approved, released/refunded
- Dispute can be raised and resolved by admin
- Both parties can leave review after completion
