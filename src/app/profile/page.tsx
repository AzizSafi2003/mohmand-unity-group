"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import { api } from "@convex/_generated/api";
import { RequireApproved } from "@/components/shared/Guards";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardHeader, CardTitle, CardBody, Field, Input, Button, Spinner, EmptyState, Badge } from "@/components/ui";
import { SectionHeading } from "@/components/ui";
import { useUiStore } from "@/store/uiStore";
import { localized, initials } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <RequireApproved>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <ProfileView />
        </main>
        <Footer />
      </div>
    </RequireApproved>
  );
}

function ProfileView() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const profile = useQuery(api.members.myProfile, {});
  const update = useMutation(api.members.update);

  const [form, setForm] = useState({ phone: "", email: "", address: "", occupation: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        address: profile.address ?? "",
        occupation: profile.occupation ?? "",
      });
    }
  }, [profile]);

  if (profile === undefined) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="container-page py-12">
        <EmptyState
          title={t("members.title")}
          description="Your account isn't linked to a family member profile yet. An administrator can link it for you."
        />
      </div>
    );
  }

  const name = `${localized(profile, "firstName", locale)} ${localized(profile, "lastName", locale)}`.trim();

  async function save() {
    setSaving(true);
    try {
      await update({
        memberId: profile!._id,
        patch: {
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          occupation: form.occupation || undefined,
        },
      });
      toast.success(t("common.save"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-page max-w-3xl space-y-8 py-8">
      <SectionHeading eyebrow={t("nav.profile")} title={t("members.title")} />

      <Card>
        <CardBody className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-pine-100 text-lg font-semibold text-pine">
            {initials(profile.firstName, profile.lastName)}
          </span>
          <div>
            <h2 className="font-display text-2xl text-ink">{name || "—"}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-faint">
              <Badge tone="pine">{t(`members.${profile.gender}`)}</Badge>
              <Badge tone="brass">{t(`members.${profile.maritalStatus}`)}</Badge>
              {profile.isHead && <Badge tone="neutral">{t("families.head")}</Badge>}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.edit")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t("members.phone")}>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label={t("members.email")}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field label={t("members.occupation")}>
              <Input value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} />
            </Field>
            <Field label={t("members.address")}>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </Field>
          </div>
          <p className="text-xs text-ink-faint">
            {t("members.firstName")}, {t("members.lastName")}, {t("members.maritalStatus")} —{" "}
            {t("common.edit").toLowerCase()} via an administrator.
          </p>
          <div className="flex justify-end">
            <Button onClick={save} loading={saving}>
              {t("common.save")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
