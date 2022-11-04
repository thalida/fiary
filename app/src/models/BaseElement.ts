import { v4 as uuidv4 } from "uuid";

export default class BaseElement {
  id: string = uuidv4();
}
