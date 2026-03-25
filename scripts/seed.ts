import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function seed() {
  await client.connect();
  console.log("Connected to database");

  await client.query("BEGIN");

  try {
    // ── Workflows ────────────────────────────────────────────────────────────

    const { rows: workflows } = await client.query<{ id: string }>(`
      INSERT INTO workflows (name, department, description, completeness_score) VALUES
        ('Accounts Payable Processing',   'Finance',     'End-to-end process for receiving, approving, and paying vendor invoices in compliance with SOX controls.',          82),
        ('Month-End Close',               'Finance',     'Procedures for closing the general ledger, reconciling accounts, and producing financial statements each month.',   74),
        ('Employee Onboarding',           'Operations',  'Cross-functional process covering IT provisioning, HR documentation, facilities access, and manager check-ins.',   91),
        ('Vendor Contract Management',    'Operations',  'Lifecycle management of vendor contracts from RFP through renewal or termination, including compliance review.',    67),
        ('Change Management (ITIL)',      'IT',          'Formal process for requesting, evaluating, approving, and implementing changes to production infrastructure.',      88),
        ('Incident Response & Recovery',  'IT',          'Detection, classification, escalation, resolution, and post-incident review for production service disruptions.',  79)
      RETURNING id
    `);

    const [apId, meclId, eoId, vcmId, cmId, irId] = workflows.map((r) => r.id);

    // ── Rules ─────────────────────────────────────────────────────────────────

    await client.query(`
      INSERT INTO rules
        (workflow_id, summary, detail, rule_type, confidence, stakeholder_validated,
         owner_email, owner_name, source) VALUES

      -- Accounts Payable Processing
      ($1, 'Three-way match required before payment',
       'Every vendor invoice must be matched against an approved purchase order and a goods receipt before it is queued for payment. Discrepancies greater than $500 or 5% of invoice value (whichever is lower) must be escalated to the AP Manager within 24 hours. Invoices without a PO require VP Finance sign-off.',
       'control', 'high', true,
       'linda.chen@corp.com', 'Linda Chen', 'SOX Control Matrix v4.2'),

      ($1, 'Payment terms must not be altered after invoice approval',
       'Once an invoice has been approved in the ERP, payment terms (net days, discount windows) may not be changed without a documented exception request countersigned by both the AP Manager and the Controller. All term changes are logged in the audit trail.',
       'policy', 'high', true,
       'linda.chen@corp.com', 'Linda Chen', 'AP Policy Manual §3.4'),

      ($1, 'Duplicate invoice detection threshold',
       'The ERP must check each incoming invoice against the past 180 days for matching vendor ID, invoice number, and amount ±2%. Suspected duplicates are held in a quarantine queue and reviewed by AP staff within one business day. Confirmed duplicates are rejected and the vendor is notified.',
       'control', 'medium', false,
       'raj.patel@corp.com', 'Raj Patel', 'Internal Audit Finding IA-2024-07'),

      ($1, 'Segregation of duties: invoice creation vs. approval',
       'The employee who enters an invoice into the ERP cannot be the same person who approves it for payment. System roles enforce this constraint. Any override requires the CISO and Controller to co-approve and is automatically flagged in the SOX evidence package.',
       'control', 'high', true,
       'linda.chen@corp.com', 'Linda Chen', 'SOX Control Matrix v4.2'),

      -- Month-End Close
      ($2, 'Trial balance must be reviewed before journal entries are posted',
       'The Controller reviews the unadjusted trial balance each month-end before any manual journal entries are posted. Variance thresholds: >$10K or >5% movement in any account line triggers a mandatory written explanation attached to the close checklist.',
       'procedure', 'high', true,
       'marcus.olsen@corp.com', 'Marcus Olsen', 'Close Runbook v2.1'),

      ($2, 'Accruals must be supported by documentation',
       'Every accrual journal entry requires an attached support document (vendor quote, contract, payroll report, or actuals-to-date schedule). Unsupported accruals above $25K are prohibited. Recurring accruals are reviewed quarterly by Internal Audit.',
       'control', 'high', true,
       'marcus.olsen@corp.com', 'Marcus Olsen', 'Close Runbook v2.1'),

      ($2, 'Intercompany eliminations must net to zero',
       'Before consolidation, the intercompany reconciliation team confirms all intercompany receivables and payables net to zero at the entity level. Differences above $1K require same-day resolution. Unresolved items block the consolidation step in the close checklist.',
       'control', 'medium', false,
       'sarah.kim@corp.com', 'Sarah Kim', 'Intercompany Policy v1.3'),

      ($2, 'Soft close freeze: no back-dated postings after day 3',
       'After the 3rd business day following month-end, no journal entries may be posted to the prior period without written approval from the Controller and CFO. The ERP period is soft-locked at this point. Hard lock occurs after the 10th business day.',
       'policy', 'high', true,
       'marcus.olsen@corp.com', 'Marcus Olsen', 'Close Runbook v2.1'),

      -- Employee Onboarding
      ($3, 'IT access provisioning must complete within 24 hours of start date',
       'All standard-role system access (email, VPN, ERP read-only, ticketing) must be provisioned before 9 AM on the employee''s first day. Access is triggered automatically by HRIS upon status change to "active". Privileged access requires a separate approved request.',
       'sla', 'high', true,
       'derek.washington@corp.com', 'Derek Washington', 'IT Provisioning SLA v3.0'),

      ($3, 'Background check clearance required before badge access',
       'Physical badge access to secure zones (data centre, finance floor, executive suite) is not granted until the background check result is received and reviewed by HR. For standard office areas, provisional badge access is permitted pending clearance for up to 5 business days.',
       'policy', 'high', true,
       'priya.sharma@corp.com', 'Priya Sharma', 'HR Policy §7.2'),

      ($3, 'Manager 30-day check-in is mandatory',
       'Hiring managers must complete a structured 30-day check-in form in the HRIS within 35 calendar days of the employee start date. Overdue check-ins are escalated to HR Business Partners. Completion rate is a KPI reported to the People Committee quarterly.',
       'procedure', 'medium', true,
       'priya.sharma@corp.com', 'Priya Sharma', 'HRIS Runbook §4.1'),

      ($3, 'Role-based security training within first 5 business days',
       'All new employees must complete the baseline security awareness training module. Employees in Finance, IT, or Legal must additionally complete the role-specific compliance module. Completion is automatically tracked; non-completion blocks expense report submission in the ERP after day 10.',
       'control', 'high', false,
       'derek.washington@corp.com', 'Derek Washington', 'InfoSec Policy §2.1'),

      -- Vendor Contract Management
      ($4, 'Legal review required for contracts above $50K',
       'Any vendor contract with a total contract value above $50K must be reviewed and signed off by the Legal department before execution. Contracts involving data processing or SaaS must also pass a Privacy review regardless of value. Standard MSAs pre-approved by Legal are exempt.',
       'policy', 'high', true,
       'nina.roberts@corp.com', 'Nina Roberts', 'Procurement Policy v5.1'),

      ($4, 'Auto-renewal clauses must be flagged 90 days before renewal date',
       'The contract management system sends automated alerts to the contract owner and their VP 90 days before any contract with an auto-renewal clause reaches its renewal date. The contract owner must log a disposition decision (renew, renegotiate, terminate) within 30 days of the alert.',
       'procedure', 'medium', false,
       'nina.roberts@corp.com', 'Nina Roberts', 'Procurement Policy v5.1'),

      ($4, 'Vendor risk assessment required annually for critical vendors',
       'Vendors classified as "critical" (single-source, revenue-impacting, or processing personal data) undergo an annual risk assessment covering financial stability, security posture, and regulatory compliance. Assessments scoring below threshold trigger an executive review.',
       'control', 'medium', false,
       'nina.roberts@corp.com', 'Nina Roberts', 'Vendor Risk Framework v2.0'),

      ($4, 'No verbal commitments: all scope changes must be in writing',
       'Any change to contracted scope, deliverables, pricing, or timeline must be documented in a signed contract amendment or change order before work begins. Verbal commitments are not binding. Employees who commit the company verbally may be held personally liable per the Employee Code of Conduct.',
       'policy', 'high', true,
       'nina.roberts@corp.com', 'Nina Roberts', 'Procurement Policy v5.1'),

      -- Change Management (ITIL)
      ($5, 'All production changes require an approved Change Request',
       'No change may be made to a production system without an approved Change Request (CR) in the ITSM tool. Emergency changes must be approved by the Emergency CAB (two on-call engineers + one IT manager) and back-filled with a full CR within 24 hours.',
       'control', 'high', true,
       'alex.torres@corp.com', 'Alex Torres', 'ITIL Change Policy v2.3'),

      ($5, 'Change freeze windows: 72 hours before and after fiscal quarter-end',
       'No non-emergency changes may be deployed during the 72-hour freeze window preceding and following each fiscal quarter-end close. The freeze window is published in the IT calendar at the start of each fiscal year. Exceptions require CFO and CTO co-approval.',
       'policy', 'high', true,
       'alex.torres@corp.com', 'Alex Torres', 'ITIL Change Policy v2.3'),

      ($5, 'Rollback plan mandatory for all standard and major changes',
       'Every Change Request must include a documented rollback plan with step-by-step instructions and an estimated rollback time. Changes without a rollback plan are rejected by the CAB. For major changes, the rollback plan must be tested in a staging environment before approval.',
       'procedure', 'high', true,
       'alex.torres@corp.com', 'Alex Torres', 'CAB Checklist v1.8'),

      ($5, 'Post-implementation review required for major changes within 5 business days',
       'All major changes (risk rating ≥ HIGH or affecting more than 500 users) require a Post-Implementation Review (PIR) completed within 5 business days of go-live. The PIR covers success criteria, issues encountered, and lessons learned, and is archived in the ITSM tool.',
       'procedure', 'medium', false,
       'alex.torres@corp.com', 'Alex Torres', 'CAB Checklist v1.8'),

      -- Incident Response & Recovery
      ($6, 'P1 incidents must be declared within 15 minutes of detection',
       'A P1 incident (complete service outage or data breach) must be declared in the ITSM tool within 15 minutes of initial detection. The on-call engineer pages the Incident Commander via PagerDuty. A war-room bridge is opened automatically. Customer comms must go out within 30 minutes of P1 declaration.',
       'sla', 'high', true,
       'alex.torres@corp.com', 'Alex Torres', 'Incident Response Playbook v4.1'),

      ($6, 'Root cause analysis required for all P1 and P2 incidents',
       'A written Root Cause Analysis (RCA) must be completed for all P1 incidents within 5 business days and for P2 incidents within 10 business days. RCAs must include timeline, contributing factors, impact assessment, and corrective actions with owners and due dates.',
       'procedure', 'high', true,
       'alex.torres@corp.com', 'Alex Torres', 'Incident Response Playbook v4.1'),

      ($6, 'Data breach incidents must notify Legal within 1 hour',
       'Any incident involving confirmed or suspected unauthorised access to personal data, financial records, or intellectual property must be escalated to Legal and the DPO within 1 hour of classification. Legal determines regulatory notification obligations (GDPR 72-hour window, SEC 4-day window).',
       'control', 'high', true,
       'alex.torres@corp.com', 'Alex Torres', 'Data Breach Response Policy v1.2'),

      ($6, 'Incident responders must log all actions in the ITSM ticket in real time',
       'All commands run, configuration changes made, and decisions taken during an active incident must be logged in the ITSM incident ticket as they occur. Post-incident reconstruction from memory is not acceptable for audit purposes. Automated runbooks must also write execution logs to the ticket.',
       'control', 'medium', false,
       'alex.torres@corp.com', 'Alex Torres', 'Incident Response Playbook v4.1')
    `, [apId, meclId, eoId, vcmId, cmId, irId]);

    // ── Experts ───────────────────────────────────────────────────────────────

    await client.query(`
      INSERT INTO experts (name, email, department, domains, risk_level) VALUES
        ('Linda Chen',        'linda.chen@corp.com',        'Finance',     ARRAY['accounts payable','invoice processing','SOX controls'],          'high'),
        ('Marcus Olsen',      'marcus.olsen@corp.com',      'Finance',     ARRAY['month-end close','general ledger','financial reporting'],         'critical'),
        ('Priya Sharma',      'priya.sharma@corp.com',      'Operations',  ARRAY['employee onboarding','HR policy','background screening'],         'medium'),
        ('Nina Roberts',      'nina.roberts@corp.com',      'Operations',  ARRAY['vendor contracts','procurement','legal compliance'],              'high'),
        ('Alex Torres',       'alex.torres@corp.com',       'IT',          ARRAY['ITIL change management','incident response','infrastructure'],    'critical'),
        ('Derek Washington',  'derek.washington@corp.com',  'IT',          ARRAY['access provisioning','security training','identity management'],  'high')
    `);

    // ── Gaps ──────────────────────────────────────────────────────────────────

    const { rows: ruleRows } = await client.query<{ id: string }>(
      `SELECT id FROM rules WHERE summary LIKE '%Duplicate invoice%' OR summary LIKE '%Auto-renewal%' LIMIT 2`
    );

    await client.query(
      `INSERT INTO gaps (rule_id, workflow_id, reason, flagged_by, status) VALUES
        ($1, $3, 'Duplicate invoice detection rule has not been validated by a stakeholder. The quarantine queue process is undocumented in the ERP runbook.', 'raj.patel@corp.com', 'open'),
        ($2, $4, 'Auto-renewal alert process is not yet configured in the contract management system. No owner assigned to monitor the alert queue.', 'nina.roberts@corp.com', 'open')`,
      [ruleRows[0].id, ruleRows[1].id, apId, vcmId]
    );

    await client.query("COMMIT");
    console.log("Seed completed successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed, rolled back:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
