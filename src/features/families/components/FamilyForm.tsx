"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "convex/react";
import toast from "react-hot-toast";
import { api } from "@convex/_generated/api";
import { Field, Input, Textarea, Button } from "@/components/ui";
import { familySchema } from "../validation";
import type { FamilyDoc } from "../types";

interface FamilyFormProps {
  mode: "create" | "edit";
  family?: FamilyDoc;
  onDone: () => void;
}

export function FamilyForm({ mode, family, onDone }: FamilyFormProps) {
  const { t } = useTranslation();
  const create = useMutation(api.families.create);
  const update = useMutation(api.families.update);

  const [values, setValues] = useState({
    name: family?.name ?? "",
    namePs: family?.namePs ?? "",
    description: family?.description ?? "",
    descriptionPs: family?.descriptionPs ?? "",
    isActive: family?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit() {
    setErrors({});
    const parsed = familySchema.safeParse(values);
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
        await create({
          name: d.name,
          namePs: d.namePs,
          description: d.description,
          descriptionPs: d.descriptionPs,
        });
        toast.success(t("common.create"));
      } else if (family) {
        await update({
          familyId: family._id,
          patch: {
            name: d.name,
            namePs: d.namePs,
            description: d.description,
            descriptionPs: d.descriptionPs,
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
        <Field label={t("families.name")} required error={errors.name}>
          <Input value={values.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label={`${t("families.name")} (پښتو)`}>
          <Input dir="rtl" value={values.namePs} onChange={(e) => set("namePs", e.target.value)} />
        </Field>
      </div>

      <Field label={t("families.description")}>
        <Textarea value={values.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label={`${t("families.description")} (پښتو)`}>
        <Textarea dir="rtl" value={values.descriptionPs} onChange={(e) => set("descriptionPs", e.target.value)} />
      </Field>

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
