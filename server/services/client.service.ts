import mongoose from "mongoose";
import Client from "../models/client.model";
import User from "../models/user.model";
import { Project } from "../types/index";

export const ClientService = {
  async getClients() {
    return Client.find({});
  },

  async saveClients(
    newClients: unknown[],
    updatedList: { _id: string; clientName: string; projects: Project[] }[],
  ) {
    if (newClients && newClients.length > 0) {
      await Client.insertMany(newClients);
    }
    if (updatedList && updatedList.length > 0) {
      const bulkOps = updatedList.map((client) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(client._id) },
          update: {
            $set: { clientName: client.clientName, projects: client.projects },
          },
        },
      }));
      await Client.bulkWrite(bulkOps);
    }
    return Client.find({});
  },

  async deleteClient(id: string): Promise<void> {
    await Client.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
  },

  async getClientsAndUsers() {
    const [clientsList, userList] = await Promise.all([
      Client.find({}),
      User.find({ role: 1 }),
    ]);
    return { clientsList, userList };
  },
};
