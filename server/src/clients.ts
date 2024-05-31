export interface RoomId {
  id: string;
  player: "1" | "2";
}

interface Client {
  id: string;
  name: string;
  room: RoomId;
}

export class ClientList {
  private clients: Client[] = [];

  public addClient = (client: Client): { error: string } | undefined => {
    const existingClientName = this.clients.find(
      (c) => c.name.trim().toLowerCase() === client.name.trim().toLowerCase()
    );
    const roomFull =
      this.clients.filter(
        (c) => c.room.id + c.room.player === client.room.id + client.room.player
      ).length >= 2;

    if (existingClientName) return { error: "Username has already been taken" };
    if (roomFull) return { error: "Room is already full" };

    this.clients.push(client);
  };

  public getClient = (id: string): Client | undefined => {
    return this.clients.find((c) => c.id === id);
  };

  public deleteClient = (id: string) => {
    this.clients.splice(
      this.clients.findIndex((c) => c.id === id),
      1
    )[0];
  };
}
