import mongoose from "mongoose";

import { interList, listSchema } from "../schemas/list.schema.js";

const List = mongoose.model<interList>("List", listSchema)

export default List
