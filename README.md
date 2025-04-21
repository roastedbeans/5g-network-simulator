# 5G Network Simulator

A comprehensive visualization and simulation tool for 5G network architecture, protocols, and security mechanisms.

## Features

- **Network Visualization**: Interactive visualization of 5G network functions and their connections using D3.js
- **Protocol Simulation**: Simulate key 5G protocols including authentication and session establishment
- **Security Analysis**: Analyze and understand 5G security mechanisms and key hierarchies
- **Real-time Messaging**: Visualize message passing between network functions

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS
- **Visualization**: D3.js for network visualization, Mermaid for protocol diagrams
- **Database**: MongoDB/Mongoose for data persistence
- **Backend**: RESTful APIs built with Next.js API routes

## Project Structure

```
5g-simulator/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # Reusable UI components
│   │   ├── network/      # Network visualization components
│   │   ├── protocol/     # Protocol visualization components
│   │   └── ui/           # General UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and shared code
│   ├── models/           # MongoDB schema definitions
│   ├── services/         # Business logic and API integrations
│   │   ├── simulator/    # 5G network simulation services
│   │   └── security/     # Security protocol services
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (optional for full functionality)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/5g-simulator.git
   cd 5g-simulator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Simulated 5G Protocols

The simulator demonstrates several key 5G protocols:

1. **5G-AKA Authentication**: The authentication flow between UE, AMF, AUSF, and UDM
2. **PDU Session Establishment**: The process of establishing a session between UE, AMF, SMF, and UPF
3. **Registration Procedure**: The registration flow for a UE connecting to the network

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- 3GPP specifications for 5G architecture
- Open5GS project for reference implementation
- The Next.js and React communities for excellent tools and libraries
