"use client";
import React, { useState } from "react";
import Container from "../../custom/Container";
import Loading from "../../custom/Loading";
import { z } from "zod";
import toast from "react-hot-toast";
import Toast from "../../custom/Toast";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { getClientErrorMessage } from "@/lib/client-error";
import { Button } from "@/components/ui/button";
import { Send, Mail, AlertCircle } from "lucide-react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const { language } = useSelector((state: IRootState) => state.settings);

  const validate = z.object({
    subject: z.string()
      .min(3, t(language, "contactMin3"))
      .max(60, t(language, "contactMax60")),
    email: z.string()
      .email(t(language, "contactRequired"))
      .min(3, t(language, "contactMin3"))
      .max(60, t(language, "contactMax60")),
    message: z.string()
      .min(3, t(language, "contactMin3"))
      .max(300, t(language, "contactMax60")),
  });

  const handleSave = async (values: { email: string; subject: string; message: string }) => {
    setLoading(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/sendemail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          subject: `[KHOMANGUON] ${values.subject}`,
          message: values.message,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.custom(<Toast message={t(language, "contactSendSuccess")} status="success" />);
      } else {
        toast.custom(<Toast message={getClientErrorMessage(data, t(language, "contactSendFail"))} status="error" />);
      }
    } catch (error) {
      toast.custom(<Toast message={t(language, "contactGenericError")} status="error" />);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3">{t(language, "contactTitle")}</h1>
            <p className="text-slate-600 leading-relaxed">{t(language, "contactSubtitle")}</p>
          </div>

          <Formik
            initialValues={{ email: "", subject: "", message: "" }}
            validationSchema={validate}
            onSubmit={handleSave}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    {t(language, "contactYourEmail")}
                  </label>
                  <Field
                    type="email"
                    name="email"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none placeholder:text-slate-400"
                    placeholder="email@example.com"
                  />
                  <ErrorMessage name="email" component="p" className="text-xs text-red-500" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-sm font-medium text-slate-700">
                    {t(language, "contactSubject")}
                  </label>
                  <Field
                    type="text"
                    name="subject"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none placeholder:text-slate-400"
                    placeholder={t(language, "contactSubjectPlaceholder")}
                  />
                  <ErrorMessage name="subject" component="p" className="text-xs text-red-500" />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-sm font-medium text-slate-700">
                    {t(language, "contactMessage")}
                  </label>
                  <Field
                    as="textarea"
                    rows={5}
                    name="message"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none placeholder:text-slate-400 resize-none"
                    placeholder={t(language, "contactMessagePlaceholder")}
                  />
                  <ErrorMessage name="message" component="p" className="text-xs text-red-500" />
                </div>

                {loading ? (
                  <Loading isLoading />
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                    size="lg"
                  >
                    <Mail className="h-4 w-4" />
                    {t(language, "contactSubmit")}
                  </Button>
                )}
              </Form>
            )}
          </Formik>
        </div>
      </Container>
    </section>
  );
}