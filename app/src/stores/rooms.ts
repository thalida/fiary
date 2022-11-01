import { defineStore } from "pinia";
import { ref } from "vue";
import { useQuery } from "@/api";
import { MyRoomsDocument } from "@/api/graphql-operations";

export const useRoomsStore = defineStore("rooms", () => {
  const rooms = ref({} as any);

  async function fetchMyRooms() {
    const { data } = await useQuery({ query: MyRoomsDocument, cachePolicy: "network-only" });
    console.log(data);
    // if (data.value?.me) {
    //   const user = data.value.me as IUser;
    //   currentUserId.value = user.id;
    //   users.value[user.id] = user;
    // }
  }

  return {
    rooms,
    fetchMyRooms,
  };
});
