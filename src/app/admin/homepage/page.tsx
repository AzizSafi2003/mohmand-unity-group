"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import { api } from "@convex/_generated/api";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { Card, CardHeader, CardTitle, CardBody, Field, Input, Textarea, Button, Spinner } from "@/components/ui";
import { HOMEPAGE_SECTIONS } from "@/lib/constants";

interface SectionRow {
  section: string;
  title?: string;
  titlePs?: string;
  subtitle?: string;
  subtitlePs?: string;
  body?: string;
  bodyPs?: string;
  data?: unknown;
  isActive?: boolean;
}

export default function AdminHomepagePage() {
  const { t } = useTranslation();
  const sections = useQuery(api.homepage.getAll) as SectionRow[] | undefined;

  return (
    <>
      <AdminPageHeader title={t("admin.homepage")} description="Edit the public landing page content (bilingual)." />
      {sections === undefined ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {HOMEPAGE_SECTIONS.map((key) => (
            <SectionEditor key={key} section={key} current={sections.find((s) => s.section === key)} />
          ))}
        </div>
      )}
    </>
  );
}

function SectionEditor({ section, current }: { section: string; current?: SectionRow }) {
  const { t } = useTranslation();
  const upsert = useMutation(api.homepage.upsertSection);

  const isObjectives = section === "objectives";
  const data = (current?.data as { items?: string[]; itemsPs?: string[] } | undefined) ?? {};

  const [form, setForm] = useState({
    title: current?.title ?? "",
    titlePs: current?.titlePs ?? "",
    subtitle: current?.subtitle ?? "",
    subtitlePs: current?.subtitlePs ?? "",
    body: current?.body ?? "",
    bodyPs: current?.bodyPs ?? "",
    items: (data.items ?? []).join("\n"),
    itemsPs: (data.itemsPs ?? []).join("\n"),
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      await upsert({
        section,
        title: form.title || undefined,
        titlePs: form.titlePs || undefined,
        subtitle: form.subtitle || undefined,
        subtitlePs: form.subtitlePs || undefined,
        body: form.body || undefined,
        bodyPs: form.bodyPs || undefined,
        data: isObjectives
          ? {
              items: form.items.split("\n").map((s) => s.trim()).filter(Boolean),
              itemsPs: form.itemsPs.split("\n").map((s) => s.trim()).filter(Boolean),
            }
          : undefined,
        isActive: true,
      });
      toast.success(`${t("common.save")} · ${section}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{section}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Title (پښتو)">
            <Input dir="rtl" value={form.titlePs} onChange={(e) => set("titlePs", e.target.value)} />
          </Field>
          <Field label="Subtitle">
            <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field label="Subtitle (پښتو)">
            <Input dir="rtl" value={form.subtitlePs} onChange={(e) => set("subtitlePs", e.target.value)} />
          </Field>
        </div>
        <Field label="Body">
          <Textarea value={form.body} onChange={(e) => set("body", e.target.value)} />
        </Field>
        <Field label="Body (پښتو)">
          <Textarea dir="rtl" value={form.bodyPs} onChange={(e) => set("bodyPs", e.target.value)} />
        </Field>

        {isObjectives && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Objectives (one per line)">
              <Textarea value={form.items} onChange={(e) => set("items", e.target.value)} />
            </Field>
            <Field label="Objectives — پښتو (one per line)">
              <Textarea dir="rtl" value={form.itemsPs} onChange={(e) => set("itemsPs", e.target.value)} />
            </Field>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={save} loading={saving}>
            {t("common.save")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
