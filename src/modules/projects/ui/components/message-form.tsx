import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

interface Props {
  projectId: string;
}

const formSchema = z.object({
  content: z
    .string()
    .min(1, "Value is required")
    .max(10000, "Value is too long"),
});

export const MessageForm = ({ projectId }: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const showUsage = false;
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const trpc = useTRPC();
  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({
            projectId,
          })
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const isPending = createMessage.isPending;
  const isDisabled = isPending || !form.formState.isValid;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createMessage.mutateAsync({
      value: values.content,
      projectId,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs",
          showUsage && "rounded-t-none"
        )}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <TextareaAutosize
              {...field}
              disabled={isPending}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              minRows={2}
              maxRows={8}
              className="pt-4 resize-none border-none w-full outline-none bg-transparent"
              placeholder="What would you to like build?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)(e);
                }
              }}
            />
          )}
        />
        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] font-mono  text-muted-foreground">
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span>&#8984</span>Enter
            </kbd>
            &nbsp;to submit
          </div>
          <Button
            className={cn(
              "size-8 rounded-full",
              isDisabled && "bg-muted-foreground border"
            )}
            disabled={isDisabled}
          >
            {isPending ? (
              <Loader2Icon className="animate-spin size-4" />
            ) : (
              <ArrowUpIcon />
            )}
            <ArrowUpIcon />
          </Button>
        </div>
      </form>
    </Form>
  );
};
