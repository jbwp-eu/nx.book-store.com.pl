"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendMessageAction } from "@/lib/actions/message.actions";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import {
  insertEmailMessageSchema,
  type InsertEmailMessage,
} from "@/lib/validators";

export default function EmailDialog({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const text = dictionary.form_contact_text;

  const form = useForm<InsertEmailMessage>({
    resolver: zodResolver(insertEmailMessageSchema(lang)),
    defaultValues: {
      email: "",
      message: "",
    },
  });

  const onSubmit = (values: InsertEmailMessage) => {
    startTransition(async () => {
      const res = await sendMessageAction(lang, values);
      if (!res?.success) {
        toast.error(res.message);
        return;
      }

      setOpen(false);
      form.reset();
      toast.success(res.message);
    });
  };

  const handleCancel = () => {
    form.reset();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" aria-label={text.title}>
          <Mail className="size-6 cursor-pointer" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{text.title}</AlertDialogTitle>
          <AlertDialogDescription />
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="w-full space-y-8"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{text.label_email}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={text.placeholder_email}
                        className="mt-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{text.label_message}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={text.placeholder_message}
                        className="mt-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={isPending}
                className="w-full sm:ml-auto sm:block sm:w-auto"
              >
                {isPending ? text.sending : text.send}
              </Button>
            </form>
          </Form>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-start">
          <AlertDialogCancel onClick={handleCancel}>
            {text.cancel}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
