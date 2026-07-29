export const adminStats = {
  totalRevenue: "₹4,89,500",
  ticketsSold: 582,
  activeEvents: 3,
  pendingPrivateRequests: 7,
  checkinCountToday: 142
};

export const adminBookings = [
  { id: "BK-9081", name: "Rohan Verma", event: "Tangy Sessions Vol. 1", date: "Aug 15, 2025", qty: 2, status: "PAID", amount: "₹1,598" },
  { id: "BK-9082", name: "Ananya Sharma", event: "Tangy Sessions Vol. 2", date: "Sep 20, 2025", qty: 1, status: "PAID", amount: "₹999" },
  { id: "BK-9083", name: "Karthik Reddy", event: "Tangy Sessions: Solstice", date: "Dec 21, 2025", qty: 3, status: "PENDING", amount: "₹3,897" }
];

export const adminPayments = [
  { txId: "TXN-882901", buyer: "Rohan Verma", method: "UPI / Razorpay", status: "SUCCESS", amount: "₹1,598", time: "10 mins ago" },
  { txId: "TXN-882902", buyer: "Ananya Sharma", method: "Credit Card", status: "SUCCESS", amount: "₹999", time: "1 hour ago" }
];
