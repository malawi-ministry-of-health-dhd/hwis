"use client";
import {
  FormikInit,
  MainButton,
  MainGrid,
  MainPaper,
  MainTypography,
  TextInputField,
  WrapperBox,
} from "@/components";
import * as yup from "yup";
import Image from "next/image";
import logoImage from "@/public/logo.png";
import { Login } from "@/hooks/login";
import { useNavigation } from "@/hooks";
import { useContext, useEffect } from "react";
import { OverlayLoader } from "@/components/backdrop";
import { AuthContext, AuthContextType } from "@/contexts";
import { useServerTime } from "@/contexts/serverTimeContext";

const schema = yup.object({
  username: yup.string().label("Username").required(),
  password: yup.string().label("Password").required(),
});

type props = {
  submit: (data: any) => void;
};

export const LoginForm = () => {
  const { mutate, isPending, isError, isSuccess, data } = Login();
  const { navigateTo } = useNavigation();
  const { setLoggedIn } = useContext(AuthContext) as AuthContextType;
  const { init, ServerTime } = useServerTime();

  useEffect(() => {
    if (isSuccess) {
      setLoggedIn(true);
      init();
      navigateTo("/dashboard");
    }
  }, [isSuccess]);

  return (
    <MainGrid container>
      <MainGrid item xs={4} lg={4}></MainGrid>
      <MainGrid item xs={4} lg={4}>
        <br />
        <br />
        <WrapperBox
          sx={{
            p: "2ch",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: "1ch",
          }}
        >
          <Image src={logoImage} alt="logo" width={100} height={100} />
          <br />
          <MainTypography variant="h3">Mahis</MainTypography>

          <OverlayLoader open={isPending} />
          <FormikInit
            initialValues={{ username: "", password: "" }}
            validationSchema={schema}
            onSubmit={async (data: any) => {
              mutate(data);
            }}
            submitButtonText="Login"
            submitButton={false}
          >
            <WrapperBox sx={{ display: "flex", flexDirection: "column" }}>
              <TextInputField
                width={"100%"}
                sx={{ mx: 0 }}
                id="username"
                name="username"
                label="Username"
              />
              <TextInputField
                width={"100%"}
                sx={{ mx: 0 }}
                id="password"
                name="password"
                label="Password"
                type="password"
              />
              {isError && (
                <MainTypography variant="body2" color={"#FF0000"}>
                  Invalid Credentials
                </MainTypography>
              )}
              <MainButton type="submit" title={"Login"} onClick={() => {}} />
            </WrapperBox>
          </FormikInit>
        </WrapperBox>
      </MainGrid>
      <MainGrid item lg={4}></MainGrid>
    </MainGrid>
  );
};
