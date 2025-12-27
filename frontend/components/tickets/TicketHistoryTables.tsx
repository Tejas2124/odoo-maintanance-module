interface Ticket {
  id: string;
  status: string;
  solvedBy: string;
  equipment: string;
}

interface Props {
  tickets: Ticket[];
}

export default function TicketHistoryTable({ tickets }: Props) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-200 text-left">
          <th className="px-4 py-2 border">Ticket ID</th>
          <th className="px-4 py-2 border">Status</th>
          <th className="px-4 py-2 border">Solved By</th>
          <th className="px-4 py-2 border">Equipment</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => (
          <tr key={ticket.id} className="hover:bg-gray-100">
            <td className="px-4 py-2 border">{ticket.id}</td>
            <td className="px-4 py-2 border">{ticket.status}</td>
            <td className="px-4 py-2 border">{ticket.solvedBy}</td>
            <td className="px-4 py-2 border">{ticket.equipment}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
