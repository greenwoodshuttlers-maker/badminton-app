/**
 * =====================================================
 * Jersey Dashboard
 *
 * Modern dashboard layout
 * Shows:
 * - Top voted designs
 * - Size summary
 * - Player preferences table
 * =====================================================
 */

import { Link } from "react-router-dom";
import TopDesigns from "../components/TopDesigns";
import PlayersTable from "../components/PlayersTable";
import SizeSummary from "../components/SizeSummary";
import JerseyStats from "../components/JerseyStats";

function JerseyDashboard() {

    return (

        <div style={container}>

            <h2 style={title}>👕 Jersey Center</h2>

            {/* Navigation */}

            <div style={navButtons}>

                <Link to="/jersey-voting">
                    <button style={votingBtn}>
                        Vote Designs
                    </button>
                </Link>

                <Link to="/player-preferences">
                    <button style={primaryBtn}>
                        Player Preferences
                    </button>
                </Link>

                <Link to="/">
                    <button style={secondaryBtn}>
                        ←
                    </button>
                </Link>

            </div>


            {/* Top Designs */}

            <JerseyStats />

            <section style={card}>
                <h3>🏆 Top Voted Designs</h3>
                <TopDesigns />
            </section>


            {/* Size Summary */}

            <section style={card}>

                <h3>📊 Jersey Size Summary</h3>

                <SizeSummary />

            </section>


            {/* Player Preferences */}

            <section style={card}>

                <h3>👥 Player Preferences</h3>

                <PlayersTable />

            </section>

        </div >

    );

}

export default JerseyDashboard;


/* ===================== Styles ===================== */

const container = {
    maxWidth: "1200px",
    margin: "auto",
    padding: "20px",
    fontFamily: "Inter, sans-serif"
};

const title = {
    marginBottom: "15px"
};

const navButtons = {
    display: "flex",
    gap: "10px",
    marginBottom: "25px",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center"
};

const primaryBtn = {
    padding: "10px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
    flex: "1 1 160px",
    maxWidth: "220px",
    width: "100%"
};

const votingBtn = {
    padding: "10px 16px",
    background: "#482de2",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
    flex: "1 1 160px",
    maxWidth: "220px",
    width: "100%"
};

const secondaryBtn = {
    padding: "10px 16px",
    background: "#3e5f8d",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    flex: "1 1 220px",
    maxWidth: "320px",
    width: "100%"
};

const card = {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
};