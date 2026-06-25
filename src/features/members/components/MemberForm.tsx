"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "convex/react";
import toast from "react-hot-toast";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Field, Input, Select, Button } from "@/components/ui";
import { GENDERS, MARITAL_STATUSES } from "@/lib/constants";
import { memberSchema } from "../validation";
import type { MemberDoc } from "../types";

type Mode = "create" | "edit";

interface MemberFormProps {
  mode: Mode;
  familyId?: Id<"families">;
  member?: MemberDoc;
  onDone: () => void;
}

/**
 * One form for both creating and editing a family member. On create it calls
 * `members.create` (needs the parent familyId); on edit it sends a `patch` to
 * `members.update`. Validation is shared (memberSchema) and errors are keyed
 * to the validation i18n namespace.
 */
export function MemberForm({ mode, familyId, member, onDone }: MemberFormProps) {
  const { t } = useTranslation();
  const create = useMutation(api.members.create);
  const update = useMutation(api.members.update);

  const [values, setValues] = useState({
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    firstNamePs: member?.firstNamePs ?? "",
    lastNamePs: member?.lastNamePs ?? "",
    gender: member?.gender ?? "male",
    maritalStatus: member?.maritalStatus ?? "single",
    dateOfBirth: member?.dateOfBirth ?? "",
    dateOfDeath: member?.dateOfDeath ?? "",
    phone: member?.phone ?? "",
    email: member?.email ?? "",
    address: member?.address ?? "",
    occupation: member?.occupation ?? "",
    notes: member?.notes ?? "",
    isHead: member?.isHead ?? false,
    isActive: member?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit() {
    setErrors({});
    const parsed = memberSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = t(issue.message);
      }
      setErrors(next);
      return;
    }
    const d = parsed.data;
    setSaving(true);
    try {
      if (mode === "create") {
        if (!familyId) throw new Error("Missing family");
        await create({
          familyId,
          firstName: d.firstName,
          lastName: d.lastName,
          firstNamePs: d.firstNamePs,
          lastNamePs: d.lastNamePs,
          gender: d.gender,
          maritalStatus: d.maritalStatus,
          dateOfBirth: d.dateOfBirth,
          phone: d.phone,
          email: d.email,
          address: d.address,
          occupation: d.occupation,
          isHead: d.isHead,
        });
        toast.success(t("common.create"));
      } else if (member) {
        await update({
          memberId: member._id,
          patch: {
            firstName: d.firstName,
            lastName: d.lastName,
            firstNamePs: d.firstNamePs,
            lastNamePs: d.lastNamePs,
            gender: d.gender,
            maritalStatus: d.maritalStatus,
            dateOfBirth: d.dateOfBirth,
            dateOfDeath: d.dateOfDeath,
            phone: d.phone,
            email: d.email,
            address: d.address,
            occupation: d.occupation,
            notes: d.notes,
            isActive: d.isActive,
          },
        });
        toast.success(t("common.save"));
      }
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("members.firstName")} required error={errors.firstName}>
          <Input value={values.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </Field>
        <Field label={t("members.lastName")} required error={errors.lastName}>
          <Input value={values.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </Field>
        <Field label={`${t("members.firstName")} (پښتو)`}>
          <Input
            dir="rtl"
            value={values.firstNamePs}
            onChange={(e) => set("firstNamePs", e.target.value)}
          />
        </Field>
        <Field label={`${t("members.lastName")} (پښتو)`}>
          <Input
            dir="rtl"
            value={values.lastNamePs}
            onChange={(e) => set("lastNamePs", e.target.value)}
          />
        </Field>
        <Field label={t("members.gender")} required>
          <Select value={values.gender} onChange={(e) => set("gender", e.target.value as typeof values.gender)}>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {t(`members.${g}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("members.maritalStatus")} required>
          <Select
            value={values.maritalStatus}
            onChange={(e) => set("maritalStatus", e.target.value as typeof values.maritalStatus)}
          >
            {MARITAL_STATUSES.map((m) => (
              <option key={m} value={m}>
                {t(`members.${m}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("members.dateOfBirth")} hint="YYYY-MM-DD">
          <Input value={values.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} placeholder="1990-05-12" />
        </Field>
        <Field label={t("members.phone")}>
          <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label={t("members.email")} error={errors.email}>
          <Input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label={t("members.occupation")}>
          <Input value={values.occupation} onChange={(e) => set("occupation", e.target.value)} />
        </Field>
      </div>

      <Field label={t("members.address")}>
        <Input value={values.address} onChange={(e) => set("address", e.target.value)} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={values.isHead}
          onChange={(e) => set("isHead", e.target.checked)}
          className="h-4 w-4 rounded border-sand text-pine focus:ring-pine/30"
        />
        {t("families.head")}
      </label>

      {mode === "edit" && (
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 rounded border-sand text-pine focus:ring-pine/30"
          />
          Active
        </label>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit} loading={saving}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
