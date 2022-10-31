<script setup lang="ts">
import { RouterView } from "vue-router";
import type { CallbackTypes } from "vue3-google-login";

import axios from "axios";
// import { useQuery } from "villus";

// const AllPosts = `
//   query AllPosts {
//     posts {
//       title
//     }
//   }
// `;

// const callback: CallbackTypes.CredentialCallback = async (response) => {
//   console.log("Authorisation code", response);
// };

const callback: CallbackTypes.TokenResponseCallback = async (response) => {
  console.log("Authorisation code", response);
  try {
    const res = await axios.get(
      `http://localhost:8000/auth/register-by-token/google-oauth2/`,
      {
        params: {
          access_token: response.access_token,
        },
      }
    );
    console.log("res", res);
  } catch (error) {
    console.log(error);
  }
  // const { data } = useQuery({
  //   query: AllPosts,
  // });
};
</script>

<template>
  <GoogleLogin :callback="callback" popup-type="TOKEN">
    <button>Login Using Google</button>
  </GoogleLogin>
  <RouterView />
</template>
