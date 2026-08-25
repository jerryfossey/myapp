import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ImportPayload } from "./importSchema";
import { parseDateOnly } from "./dates";
import { getTimeCategory } from "./timeCategories";

type Counts = { created: number; updated: number; untouched: number };
const emptyCounts = (): Counts => ({ created: 0, updated: 0, untouched: 0 });

export type ImportSummary = {
  meta: "created" | "updated" | "untouched";
  bhag: "created" | "updated" | "untouched";
  areas: Counts;
  reports: Counts;
  followUps: Counts;
  time: Counts;
};

/**
 * Upsert by id: insert items that are new, update only the assistant-owned
 * fields on items that already exist, and leave every owner-owned field
 * alone. See the field-ownership table in the build brief (section 2).
 */
export async function runImport(payload: ImportPayload): Promise<ImportSummary> {
  const summary: ImportSummary = {
    meta: "untouched",
    bhag: "untouched",
    areas: emptyCounts(),
    reports: emptyCounts(),
    followUps: emptyCounts(),
    time: emptyCounts(),
  };

  await prisma.$transaction(async (tx) => {
    if (payload.meta) {
      const existing = await tx.meta.findUnique({ where: { id: 1 } });
      await tx.meta.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          owner: payload.meta.owner ?? "Jerry",
          today: parseDateOnly(payload.meta.today ?? new Date()),
        },
        update: {
          ...(payload.meta.owner !== undefined ? { owner: payload.meta.owner } : {}),
          ...(payload.meta.today !== undefined ? { today: parseDateOnly(payload.meta.today) } : {}),
        },
      });
      summary.meta = existing ? "updated" : "created";
    }

    if (payload.bhag) {
      const existing = await tx.bhag.findUnique({ where: { id: 1 } });
      const b = payload.bhag;
      const bhagRow = await tx.bhag.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          label: b.label ?? "BHAG",
          cashOnHand: b.cashOnHand ?? 0,
          cashTarget: b.cashTarget ?? 0,
          helocBalance: b.helocBalance ?? 0,
          asOf: parseDateOnly(b.asOf ?? new Date()),
          note: b.note ?? null,
        },
        update: {
          ...(b.label !== undefined ? { label: b.label } : {}),
          ...(b.cashOnHand !== undefined ? { cashOnHand: b.cashOnHand } : {}),
          ...(b.cashTarget !== undefined ? { cashTarget: b.cashTarget } : {}),
          ...(b.helocBalance !== undefined ? { helocBalance: b.helocBalance } : {}),
          ...(b.asOf !== undefined ? { asOf: parseDateOnly(b.asOf) } : {}),
          ...(b.note !== undefined ? { note: b.note } : {}),
        },
      });
      summary.bhag = existing ? "updated" : "created";

      // Log a snapshot on every import that includes a bhag block, using the
      // resolved row (not the possibly-partial payload) so a snapshot always
      // has complete values even when the payload only touched one field.
      await tx.snapshot.create({
        data: {
          kind: "bhag",
          cashOnHand: bhagRow.cashOnHand,
          helocBalance: bhagRow.helocBalance,
          cashTarget: bhagRow.cashTarget,
          asOf: bhagRow.asOf,
        },
      });
    }

    for (const area of payload.areas ?? []) {
      const existingArea = await tx.area.findUnique({ where: { id: area.id } });

      if (!existingArea) {
        await tx.area.create({
          data: {
            id: area.id,
            name: area.name,
            state: area.state ?? "",
            metricLabel: area.metric?.label ?? "",
            metricValue: area.metric?.value ?? "",
            constraint: area.constraint ?? "",
            lever: area.lever ?? "",
          },
        });
        summary.areas.created++;
      } else {
        const next: Prisma.AreaUpdateInput = {};
        if (area.name !== undefined && area.name !== existingArea.name) next.name = area.name;
        if (area.state !== undefined && area.state !== existingArea.state) next.state = area.state;
        if (area.metric?.label !== undefined && area.metric.label !== existingArea.metricLabel)
          next.metricLabel = area.metric.label;
        if (area.metric?.value !== undefined && area.metric.value !== existingArea.metricValue)
          next.metricValue = area.metric.value;
        if (area.constraint !== undefined && area.constraint !== existingArea.constraint)
          next.constraint = area.constraint;
        if (area.lever !== undefined && area.lever !== existingArea.lever) next.lever = area.lever;

        if (Object.keys(next).length > 0) {
          await tx.area.update({ where: { id: area.id }, data: next });
          summary.areas.updated++;
        } else {
          summary.areas.untouched++;
        }
      }

      for (const report of area.reports ?? []) {
        const existingReport = await tx.report.findUnique({ where: { id: report.id } });

        if (!existingReport) {
          await tx.report.create({
            data: {
              id: report.id,
              areaId: area.id,
              person: report.person,
              owes: report.owes,
              cadence: report.cadence,
              status: report.status ?? "due",
            },
          });
          summary.reports.created++;
        } else {
          const next: Prisma.ReportUpdateInput = {};
          if (report.person !== existingReport.person) next.person = report.person;
          if (report.owes !== existingReport.owes) next.owes = report.owes;
          if (report.cadence !== existingReport.cadence) next.cadence = report.cadence;
          // status is owner-owned; never overwritten on update.

          if (Object.keys(next).length > 0) {
            await tx.report.update({ where: { id: report.id }, data: next });
            summary.reports.updated++;
          } else {
            summary.reports.untouched++;
          }
        }
      }

      for (const fu of area.followUps ?? []) {
        const existingFu = await tx.followUp.findUnique({ where: { id: fu.id } });

        if (!existingFu) {
          await tx.followUp.create({
            data: {
              id: fu.id,
              areaId: area.id,
              item: fu.item,
              waitingOn: fu.waitingOn,
              nextAction: fu.nextAction,
              status: fu.status ?? "open",
              priority: fu.priority ?? null,
              lastTouched: parseDateOnly(fu.lastTouched ?? new Date()),
              notes: fu.notes
                ? { create: fu.notes.map((n) => ({ at: new Date(n.at), text: n.text })) }
                : undefined,
            },
          });
          summary.followUps.created++;
        } else {
          const next: Prisma.FollowUpUpdateInput = {};
          if (fu.item !== existingFu.item) next.item = fu.item;
          if (fu.nextAction !== existingFu.nextAction) next.nextAction = fu.nextAction;
          // waitingOn behaves like lastTouched: set on create only, never
          // overwritten on update. The in-app Delegate action also writes
          // waitingOn, so on an update it's ambiguous whether the payload's
          // value reflects newer assistant context or is just stale relative
          // to a delegation the owner made since the last import — treating
          // it as owner-owned once created avoids silently reverting a
          // delegation.
          // status, priority, notes, lastTouched, waitingOn are owner-owned;
          // never overwritten on update, per the field-ownership table.

          if (Object.keys(next).length > 0) {
            await tx.followUp.update({ where: { id: fu.id }, data: next });
            summary.followUps.updated++;
          } else {
            summary.followUps.untouched++;
          }
        }
      }
    }

    if (payload.time) {
      const { week, entries } = payload.time;
      const uploadDate = (payload.meta?.today ?? new Date().toISOString()).slice(0, 10);
      await tx.timeUploadLog.upsert({
        where: { week_date: { week, date: uploadDate } },
        create: { week, date: uploadDate },
        update: {},
      });
      for (const entry of entries) {
        const existingWeek = await tx.timeWeek.findUnique({
          where: { week_categoryId: { week, categoryId: entry.categoryId } },
        });
        // planned is owner-editable config; only seed it on first creation
        // (from the category defaults), never overwrite it from an import.
        const plannedDefault = getTimeCategory(entry.categoryId)?.planned ?? 0;
        await tx.timeWeek.upsert({
          where: { week_categoryId: { week, categoryId: entry.categoryId } },
          create: { week, categoryId: entry.categoryId, planned: plannedDefault, actual: entry.actual },
          update: { actual: entry.actual },
        });
        summary.time[existingWeek ? "updated" : "created"]++;
      }
    }
  });

  return summary;
}
