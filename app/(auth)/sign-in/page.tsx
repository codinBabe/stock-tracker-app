"use client";

import FooterLink from "@/components/forms/footer-link";
import InputField from "@/components/forms/input-field";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";

const SignIn = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });
  const onSubmit = async (data: SignInFormData) => {
    // Handle form submission logic here
    try {
      console.log("Form Data:", data);
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  return (
    <>
      <h1 className="form-title">Login to Your Account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="email"
          label="Email"
          placeholder="johndoe@example.com"
          register={register}
          error={errors.email}
          validation={{ required: "Email is required", pattern: /^\S+@\S+$/i }}
        />
        <InputField
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 6 }}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>

        <FooterLink
          text="Don't have an account?"
          linkText="Sign Up"
          href="/sign-up"
        />
      </form>
    </>
  );
};

export default SignIn;
