"use client";

import { ComponentProps, FC, Key, useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeftIcon, PasswordIcon, PersonIcon, SettingsIcon } from "@/assets/icons";
import { FileInput } from "@/ui/file-input";
import { Portal } from "@/ui/misc/portal";
import { Render } from "@/ui/misc/render";
import { PasswordInput } from "@/ui/password-input";
import { PhoneInput } from "@/ui/phone-input";
import { Button } from "@nextui-org/button";
import { Input, Textarea } from "@nextui-org/input";
import { Link } from "@nextui-org/link";
import { Listbox, ListboxItem } from "@nextui-org/listbox";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { clone } from "lodash";
import queryString from "query-string";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import StickyBox from "react-sticky-box";
import { v4 as uuidv4 } from "uuid";

import { useApi, useUnauthenticated, useUser } from "@/lib/api/client";
import { User } from "@/lib/api/types";
import { getErrorMessage, isApiError } from "@/lib/api/utils";
import { useBreakpoint, useConditionalState } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export interface AccountSettingsProps {
  opened: boolean;
  onClose: (force?: boolean) => void;
}

export const AccountSettingsModal: FC<AccountSettingsProps> = ({ opened, onClose }) => {
  const router = useRouter();

  useUnauthenticated(() => {
    router.replace(queryString.stringifyUrl({ url: "/", query: { dialogId: "sign-in" } }));
  });

  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const sm = useBreakpoint("sm", "up");
  const md = useBreakpoint("md", "up");

  const footerId = useRef(uuidv4()).current;

  const onBack = () => {
    setSelectedKeys([]);
  };

  const onRestore = () => {
    setSelectedKeys(["edit-profile"]);
  };

  useEffect(() => {
    if (sm && !selectedKeys.length) onRestore();
  }, [sm, selectedKeys.length]);

  return (
    <>
      <Modal
        isKeyboardDismissDisabled={true}
        isOpen={opened}
        onClose={() => onClose()}
        size={md ? "3xl" : "full"}
        scrollBehavior={md ? "inside" : undefined}
        classNames={{
          base: md ? "h-[80%]" : ""
        }}
      >
        <ModalContent>
          <ModalHeader className="grid grid-cols-1 items-center sm:grid-cols-3">
            <div className=" hidden items-center gap-x-4 sm:flex">
              <Button isIconOnly variant="flat" disableRipple={!selectedKeys.length} color="default" size="sm" aria-label="Back" onPress={onBack}>
                {!sm && selectedKeys.length ? <ChevronLeftIcon className="h-5 w-5" /> : <SettingsIcon className="h-5 w-5" type="outlined" />}
              </Button>
              <div>Settings</div>
            </div>
            <div className="flex items-center gap-x-4">
              <Button className="sm:hidden" isIconOnly variant="flat" disableRipple={!selectedKeys.length} color="default" size="sm" aria-label="Back" onPress={onBack}>
                {!sm && selectedKeys.length ? <ChevronLeftIcon className="h-5 w-5" /> : <SettingsIcon className="h-5 w-5" type="outlined" />}
              </Button>
              <Render as="div" className="sm:pl-4" switch={selectedKeys}>
                <div key="edit-profile">Edit Profile</div>
                <div key="change-password">Change Password</div>
                <div>Settings</div>
              </Render>
            </div>
          </ModalHeader>
          <ModalBody className="grid grid-cols-3 items-start overflow-y-auto">
            <StickyBox className={cn("col-span-3 w-full space-y-2 sm:col-span-1", selectedKeys.length ? "hidden sm:block" : "")}>
              <Listbox
                aria-label="Settings Menu"
                className={"w-full"}
                itemClasses={{ base: "h-12 data-[selected=true]:!bg-default-200" }}
                variant="flat"
                disallowEmptySelection
                selectionMode="single"
                selectedKeys={selectedKeys}
                onSelectionChange={(keys) => setSelectedKeys(Array.from(keys))}
              >
                <ListboxItem
                  key="edit-profile"
                  selectedIcon={() => <></>}
                  startContent={
                    <IconWrapper className="bg-primary/10 text-primary">
                      <PersonIcon type="outlined" className="h-5 w-5" />
                    </IconWrapper>
                  }
                >
                  Edit Profile
                </ListboxItem>
                <ListboxItem
                  key="change-password"
                  selectedIcon={() => <></>}
                  startContent={
                    <IconWrapper className="bg-secondary/10 text-secondary">
                      <PasswordIcon type="outlined" className="h-5 w-5" />
                    </IconWrapper>
                  }
                >
                  Change Password
                </ListboxItem>
              </Listbox>
            </StickyBox>
            <Render switch={selectedKeys} as="div" className={cn("col-span-3 sm:col-span-2", !selectedKeys.length && "hidden")}>
              <EditProfileView key="edit-profile" footerId={footerId} />
              <ChangePasswordView key="change-password" footerId={footerId} />
            </Render>
          </ModalBody>
          <ModalFooter id={footerId} className={cn("flex justify-end", !selectedKeys.length && "hidden")}></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export interface EditProfileInputs {
  firstName: string;
  lastName: string;
  userName: string;
  email?: string;
  phoneNumber?: string;
  bio: string;
  avatarId?: string;
}

export const EditProfileView: FC<{ footerId: string }> = ({ footerId }) => {
  const api = useApi();
  const pathname = usePathname();
  const currentUser = useUser() ?? ({} as User);
  const form = useForm<EditProfileInputs>({
    defaultValues: {
      userName: currentUser.userName,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      phoneNumber: currentUser.phoneNumber,
      bio: currentUser.bio
    }
  });
  const formErrors = useConditionalState(clone(form.formState.errors), !form.formState.isSubmitting);
  const componentId = useRef(uuidv4()).current;
  const [status, setStatus] = useState<{ action: "idle" | "submitting"; error?: any }>({ action: "idle" });

  const onEditProfile: SubmitHandler<EditProfileInputs> = async (inputs) => {
    try {
      setStatus({ action: "submitting" });
      await api.put("/users/current", inputs);
      await api.refresh();
      setStatus({ action: "idle" });

      toast.success("Profile saved.", { id: componentId });
    } catch (error) {
      setStatus({ action: "idle", error });

      if (isApiError(error)) {
        if (error.response) {
          const fields = Object.entries<string[]>(error.response.data.errors || []);
          fields.forEach(([name, message]) => {
            form.setError(name as any, { message: message?.join("\n") });
          });
        }
      }

      toast.error(getErrorMessage(error), { id: componentId });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onEditProfile)}>
      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-4">
          <div className="flex items-center justify-center">
            <Controller
              control={form.control}
              name="avatarId"
              render={({ field: { onChange, value, ref } }) => (
                <FileInput ref={ref} className="h-40 w-40" endpoint="/users/current/avatar" variant="circle" value={value} onChange={(value) => onChange(value)} />
              )}
            />
          </div>
        </div>
        <div className="col-span-4">
          <Controller
            control={form.control}
            name="userName"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <Input
                ref={ref}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                value={value}
                isInvalid={!!formErrors.userName}
                errorMessage={formErrors.userName?.message}
                autoComplete="off"
                label="Username"
              />
            )}
          />
        </div>
        <div className="col-span-2">
          <Controller
            control={form.control}
            name="firstName"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <Input
                ref={ref}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                value={value}
                isInvalid={!!formErrors.firstName}
                errorMessage={formErrors.firstName?.message}
                autoComplete="off"
                label="First name"
              />
            )}
          />
        </div>
        <div className="col-span-2">
          <Controller
            control={form.control}
            name="lastName"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <Input
                ref={ref}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                value={value}
                isInvalid={!!formErrors.firstName}
                errorMessage={formErrors.firstName?.message}
                autoComplete="off"
                label="Last name"
              />
            )}
          />
        </div>
        <div className="col-span-4">
          <Controller
            control={form.control}
            name="email"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <Input
                ref={ref}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                value={value}
                isInvalid={!!formErrors.email}
                errorMessage={formErrors.email?.message}
                autoComplete="off"
                label={`Email${currentUser.emailRequired ? " (primary)" : ""}`}
                description={
                  currentUser.email &&
                  !currentUser.emailConfirmed && (
                    <div className="flex items-center pt-1 text-end text-sm">
                      <Link as={NextLink} className="text-sm" href={queryString.stringifyUrl({ url: pathname, query: { dialogId: "verify-email", username: currentUser.email } })}>
                        Verify email address
                      </Link>
                    </div>
                  )
                }
              />
            )}
          />
        </div>
        <div className="col-span-4">
          <Controller
            control={form.control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <PhoneInput
                ref={ref}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                value={value}
                isInvalid={!!formErrors.phoneNumber}
                errorMessage={formErrors.phoneNumber?.message}
                autoComplete="off"
                countryVisibility={true}
                label={`Phone number${currentUser.phoneNumberRequired ? " (primary)" : ""}`}
                description={
                  currentUser.phoneNumber &&
                  !currentUser.phoneNumberConfirmed && (
                    <div className="flex items-center pt-1 text-end text-sm">
                      <Link
                        as={NextLink}
                        className="text-sm"
                        href={queryString.stringifyUrl({ url: pathname, query: { dialogId: "verify-phone-number", username: currentUser.phoneNumber } })}
                      >
                        Verify phone number
                      </Link>
                    </div>
                  )
                }
              />
            )}
          />
        </div>
        <div className="col-span-4">
          <Controller
            control={form.control}
            name="bio"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <Textarea
                ref={ref}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                value={value}
                isInvalid={!!formErrors.firstName}
                errorMessage={formErrors.firstName?.message}
                autoComplete="off"
                label="Bio"
                maxRows={4}
              />
            )}
          />
        </div>
      </div>
      <Portal rootId={footerId}>
        <Button color="primary" onPress={() => form.handleSubmit(onEditProfile)()} isLoading={status.action == "submitting"}>
          Save changes
        </Button>
      </Portal>
    </form>
  );
};

export interface ChangePasswordInputs {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const ChangePasswordView: FC<{ footerId: string }> = ({ footerId }) => {
  const api = useApi();
  const pathname = usePathname();
  const form = useForm<ChangePasswordInputs>({
    defaultValues: {
      currentPassword: "",
      newPassword: ""
    }
  });
  const formErrors = useConditionalState(clone(form.formState.errors), !form.formState.isSubmitting);
  const componentId = useRef(uuidv4()).current;
  const [status, setStatus] = useState<{ action: "idle" | "submitting"; error?: any }>({ action: "idle" });

  const onChangePassword: SubmitHandler<ChangePasswordInputs> = async (inputs) => {
    try {
      setStatus({ action: "submitting" });
      await api.post("/users/password/change", inputs);
      await api.refresh();
      setStatus({ action: "idle" });

      toast.success("Password changed.", { id: componentId });
    } catch (error) {
      setStatus({ action: "idle", error });

      if (isApiError(error)) {
        if (error.response) {
          const fields = Object.entries<string[]>(error.response.data.errors || []);
          fields.forEach(([name, message]) => {
            form.setError(name as any, { message: message?.join("\n") });
          });
        }
      }

      toast.error(getErrorMessage(error), { id: componentId });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onChangePassword)}>
      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-4">
          <Controller
            control={form.control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <PasswordInput
                ref={ref}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                value={value}
                isInvalid={!!formErrors.currentPassword}
                errorMessage={formErrors.currentPassword?.message}
                autoComplete="off"
                label="Current password"
              />
            )}
          />
          <div className="flex items-center justify-end pt-2 text-end text-sm">
            <Link as={NextLink} className="text-sm" href={queryString.stringifyUrl({ url: pathname, query: { dialogId: "reset-password" } })}>
              Forgot password?
            </Link>
          </div>
        </div>
        <div className="col-span-4">
          <Controller
            control={form.control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <PasswordInput
                ref={ref}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                value={value}
                isInvalid={!!formErrors.newPassword}
                errorMessage={formErrors.newPassword?.message}
                autoComplete="off"
                label="New password"
              />
            )}
          />
        </div>
        <div className="col-span-4">
          <Controller
            control={form.control}
            name="confirmNewPassword"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <PasswordInput
                ref={ref}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                value={value}
                isInvalid={!!formErrors.confirmNewPassword}
                errorMessage={formErrors.confirmNewPassword?.message}
                autoComplete="off"
                label="Confirm new password"
              />
            )}
          />
        </div>
        <div className="col-span-4 flex flex-row justify-end">
          <Button color="primary" onPress={() => form.handleSubmit(onChangePassword)()} isLoading={status.action == "submitting"}>
            Change password
          </Button>
        </div>
      </div>
    </form>
  );
};

const IconWrapper: FC<ComponentProps<"div">> = ({ children, className }) => (
  <div className={cn(className, "flex h-7 w-7 items-center justify-center rounded-small")}>{children}</div>
);
