export interface RoomId {
  id: string;
  player: '1' | '2';
}

interface Client {
  id: string;
  clientName: string;
  roomId: RoomId;
}

export class ClientList {
  private clients: Client[] = [];

  public checkCreateRoom(client: Client): { error: string } | undefined {
    const roomAlreadyExisting = this.clients.find((c) => c.roomId.id === client.roomId.id);
    if (roomAlreadyExisting) return { error: 'Room was already created' };
  }

  public checkJoinRoom(client: Client): { error: string } | undefined {
    const existingClientName = this.clients.find(
      (c) => c.clientName.trim().toLowerCase() === client.clientName.trim().toLowerCase(),
    );
    const existingSocketId = this.clients.find((c) => c.id === client.id);
    const roomFull =
      this.clients.filter((c) => c.roomId.id + c.roomId.player === client.roomId.id + client.roomId.player).length >= 2;
    if (existingClientName) return { error: 'Name has already been taken' };
    if (existingSocketId) return { error: 'Client already inside a room' };
    if (roomFull) return { error: 'Room is already full' };
  }

  public addClient = (client: Client) => {
    this.clients.push(client);
  };

  public getClient = (id: string): Client | undefined => {
    return this.clients.find((c) => c.id === id);
  };

  public deleteClient = (id: string) => {
    this.clients.splice(
      this.clients.findIndex((c) => c.id === id),
      1,
    )[0];
  };
}
