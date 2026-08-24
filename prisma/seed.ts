// Seeds the store via the same upsert path used by POST /api/import, per
// the build brief section 9.
import { importPayloadSchema } from "../lib/importSchema";
import { runImport } from "../lib/importUpsert";
import { prisma } from "../lib/prisma";

const payload = {
  meta: { owner: "Jerry", today: "2026-08-24" },
  bhag: {
    label: "BHAG — Dec 31, 2026",
    cashOnHand: 99556,
    cashTarget: 1000000,
    helocBalance: 148111,
    asOf: "2026-06-30",
    note: "Personal figures stale; refresh from Wave export",
  },
  areas: [
    {
      id: "fairview",
      name: "Fairview Architectural",
      state:
        "Net income run rate ~$1.64M reported / ~$2.30M adjusted. Distributions lagging the 40% policy.",
      metric: { label: "My distributions YTD", value: "$18,900 / $200k goal" },
      constraint:
        "Demand coverage and follow-up discipline. Deals lost to lack of follow-up, not lead time or supply.",
      lever: "Build the follow-up mechanism in Legrand. Owner: me.",
      reports: [
        {
          id: "fairview-rep-cooper",
          person: "Cooper",
          owes: "Weekly sales pipeline review",
          cadence: "weekly",
          status: "due",
        },
        {
          id: "fairview-rep-supply",
          person: "Eric & Cameron",
          owes: "Effective Supply Chain status",
          cadence: "monthly",
          status: "in",
        },
      ],
      followUps: [
        {
          id: "fairview-fu-1",
          item: "Set the week's pipeline agenda in Legrand",
          waitingOn: "me",
          nextAction: "Monday 6:30 own-agenda block",
          status: "open",
          priority: 1,
          lastTouched: "2026-08-17",
          notes: [],
        },
        {
          id: "fairview-fu-2",
          item: "Confirm Tom ramp progress with Cooper",
          waitingOn: "Cooper",
          nextAction: "Add to sales review agenda",
          status: "open",
          priority: null,
          lastTouched: "2026-08-10",
          notes: [],
        },
      ],
    },
    {
      id: "properties",
      name: "Properties",
      state: "Portfolio drain down after 481 Cal sale. Dudley is the dominant swing factor.",
      metric: { label: "Portfolio economic loss", value: "~$8k/mo (pre-481 close)" },
      constraint:
        "Reaching break-even or real exits. Dudley debt service is the structural drag.",
      lever: "Push Dudley toward a real-price buyer or a high-value-add tenant. Owner: me.",
      reports: [
        {
          id: "properties-rep-ray",
          person: "Ray",
          owes: "Dudley property management status",
          cadence: "monthly",
          status: "in",
        },
      ],
      followUps: [
        {
          id: "prop-fu-dudley",
          item: "Dudley: chase brokers beyond the $5/sf lowball",
          waitingOn: "me",
          nextAction: "Protected Thursday half-day calls",
          status: "open",
          priority: 2,
          lastTouched: "2026-08-04",
          notes: [],
        },
        {
          id: "prop-fu-1100",
          item: "1100 Hwy 84: resolve cut power to enable rent/sale",
          waitingOn: "me",
          nextAction: "Get utility reconnect quote",
          status: "open",
          priority: null,
          lastTouched: "2026-07-28",
          notes: [],
        },
        {
          id: "prop-fu-1215",
          item: "1215 Oak KS: find a tenant",
          waitingOn: "me",
          nextAction: "List with local broker",
          status: "open",
          priority: null,
          lastTouched: "2026-08-01",
          notes: [],
        },
      ],
    },
    {
      id: "mbe",
      name: "Modern Building Envelope (MBE)",
      state: "Product fully built by Bobos, near-zero revenue. Highest-leverage underworked asset.",
      metric: { label: "YTD net", value: "-$12,160; entity cash $988" },
      constraint: "Protected time. Operational work crowds out sponsor closes every week.",
      lever: "MBE Live sponsor conversations. Owner: me (closes), Stephanie (execution).",
      reports: [
        {
          id: "mbe-rep-steph",
          person: "Stephanie McLin",
          owes: "MBE Live sponsorship pipeline",
          cadence: "weekly",
          status: "overdue",
        },
      ],
      followUps: [
        {
          id: "mbe-fu-docs",
          item: "Review Bobos MBE Foundational Docs to set line-item targets",
          waitingOn: "me",
          nextAction: "Tuesday MBE morning block",
          status: "open",
          priority: null,
          lastTouched: "2026-07-30",
          notes: [],
        },
        {
          id: "mbe-fu-author",
          item: "Named Author Sponsorships: qualify the interest",
          waitingOn: "Stephanie McLin",
          nextAction: "Direction on next call",
          status: "open",
          priority: null,
          lastTouched: "2026-08-05",
          notes: [],
        },
      ],
    },
    {
      id: "pembroke",
      name: "Pembroke Properties",
      state:
        "Recurring bookkeeping + consulting income only. Annualizing ~$9.7k against a $50k goal.",
      metric: { label: "YTD net profit", value: "$4,862" },
      constraint: "Needs a new revenue line or a restated goal. Idea backlog exceeds capacity.",
      lever: "Hold. Do not start the property-listing site yet.",
      reports: [],
      followUps: [
        {
          id: "pemb-fu-goal",
          item: "Decide: restate $50k goal or commit a revenue line",
          waitingOn: "me",
          nextAction: "Thursday finance block",
          status: "open",
          priority: null,
          lastTouched: "2026-07-30",
          notes: [],
        },
      ],
    },
    {
      id: "jcb",
      name: "JCB Holdings / BDaaS",
      state: "Profit is accrual, not cash (entity cash $4,828). BDaaS is the live initiative.",
      metric: { label: "YTD net profit (thru 5/31)", value: "$64,086" },
      constraint: "Proving BDaaS with Jorge before it hits the floor.",
      lever: "Jorge runs each new campaign solo first (~300-500 dials) to prove it. Owner: Jorge.",
      reports: [
        {
          id: "jcb-rep-jorge",
          person: "Jorge Cruz",
          owes: "BDaaS dial counts and proof results",
          cadence: "weekly",
          status: "due",
        },
      ],
      followUps: [
        {
          id: "jcb-fu-proof",
          item: "Review Jorge's first campaign proof numbers",
          waitingOn: "Jorge Cruz",
          nextAction: "Set go/no-go gate",
          status: "open",
          priority: null,
          lastTouched: "2026-08-12",
          notes: [],
        },
      ],
    },
    {
      id: "4ever",
      name: "4ever Outdoor",
      state: "Cornhole brand held by Fairview. Turnaround to break-even, recovering known bleed.",
      metric: { label: "Target", value: "Break-even (revenue covers Jim P cost)" },
      constraint: "Break-even. Recovering ~$200k/yr of known bleed beats speculative new revenue.",
      lever: "Direct Eric on unit economics; Ray on assembly. Owner: Eric.",
      reports: [
        {
          id: "4ever-rep-eric",
          person: "Eric",
          owes: "4ever unit economics / path to break-even",
          cadence: "monthly",
          status: "due",
        },
      ],
      followUps: [
        {
          id: "4ever-fu-jimp",
          item: "Decide Jim P winter plan (furlough vs family-funded southern sales)",
          waitingOn: "me",
          nextAction: "Wednesday 4ever block",
          status: "open",
          priority: null,
          lastTouched: "2026-08-02",
          notes: [],
        },
      ],
    },
    {
      id: "personal",
      name: "Personal / BHAG",
      state:
        "Cash gap to $1M is ~$900k. Math does not close in 2026 absent a windfall; building run rate.",
      metric: { label: "Cash on hand", value: "$99,556 (3/31, stale)" },
      constraint: "Liquidity. Every decision weighed against cash, not net worth.",
      lever: "Get fresh Wave personal export; size the 2024 tax amendment with Neil.",
      reports: [],
      followUps: [
        {
          id: "pers-fu-wave",
          item: "Pull fresh Wave Personal export as of 6/30",
          waitingOn: "me",
          nextAction: "Thursday finance block",
          status: "open",
          priority: null,
          lastTouched: "2026-07-30",
          notes: [],
        },
        {
          id: "pers-fu-neil",
          item: "Get 2024 amendment number from Neil Pacifico (CLP)",
          waitingOn: "Neil Pacifico",
          nextAction: "Email follow-up",
          status: "open",
          priority: null,
          lastTouched: "2026-08-06",
          notes: [],
        },
      ],
    },
  ],
};

async function main() {
  const parsed = importPayloadSchema.parse(payload);
  const summary = await runImport(parsed);
  console.log("Seed import summary:", JSON.stringify(summary, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
