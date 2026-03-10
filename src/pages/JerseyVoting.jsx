/**
 * =====================================================
 * Jersey Voting Page
 *
 * Features
 * ✔ Max 5 votes
 * ✔ Lazy loading
 * ✔ Sticky header with collapsible votes
 * ✔ Mobile responsive layout
 * ✔ Image fullscreen preview
 * =====================================================
 */

import { useEffect, useState } from "react";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import DesignCard from "../components/DesignCard";
import { Link } from "react-router-dom";

function JerseyVoting() {

    const storage = getStorage();

    const [images, setImages] = useState([]);
    const [selected, setSelected] = useState([]);
    const [visible, setVisible] = useState(20);

    const [preview, setPreview] = useState(null);
    const [votesOpen, setVotesOpen] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const userId = currentUser?.id;
    const userName = currentUser?.name;


    /* =============================
       Load images
    ==============================*/

    useEffect(() => {

        const listRef = ref(storage, "jersey-designs");

        listAll(listRef).then(async (res) => {

            const results = await Promise.all(

                res.items.map(async (item) => {

                    const url = await getDownloadURL(item);

                    return {
                        id: item.name,
                        url
                    };

                })

            );

            setImages(results);

        });

    }, []);


    /* =============================
       Load existing votes
    ==============================*/

    useEffect(() => {

        const loadVotes = async () => {

            if (!userId) return;

            const ref = doc(db, "userVotes", userId);

            const snap = await getDoc(ref);

            if (!snap.exists()) return;

            const ids = snap.data().designs || [];

            const selectedImages = images.filter(i =>
                ids.includes(i.id)
            );

            setSelected(selectedImages);

        };

        loadVotes();

    }, [images]);


    /* =============================
       Remove vote
    ==============================*/

    const removeVote = async (design) => {

        const { removeVoteFromDesign } =
            await import("../utils/voteUtils");

        await removeVoteFromDesign(design, userId, userName);

        setSelected(
            selected.filter(d => d.id !== design.id)
        );

    };


    /* =============================
       Clear all votes
    ==============================*/

    const clearAllVotes = async () => {

        if (!window.confirm("Clear all your votes?")) return;

        const { removeVoteFromDesign } =
            await import("../utils/voteUtils");

        for (const design of selected) {
            await removeVoteFromDesign(design, userId, userName);
        }

        setSelected([]);

    };


    /* =============================
       Lazy loading
    ==============================*/

    const loadMore = () => {
        setVisible(v => v + 20);
    };


    return (

        <div style={container}>

            <h2 style={title}>👕 Jersey Design Voting</h2>

            <p style={subtitle}>
                Select up to 5 designs for the club jersey
            </p>


            {/* ==========================
          Sticky Header
      ===========================*/}

            <div style={stickyHeader}>

                {/* Top Buttons */}

                <div style={topButtons}>

                    <button
                        onClick={clearAllVotes}
                        style={clearBtn}
                    >
                        Clear Votes
                    </button>

                    <Link to="/jersey-dashboard">
                        <button style={backBtn}>
                            Dashboard
                        </button>
                    </Link>

                </div>


                {/* Collapsible Vote Section */}

                <div
                    style={voteHeader}
                    onClick={() => setVotesOpen(!votesOpen)}
                >
                    <span>Your Votes: {selected.length} / 5</span>
                    <span>{votesOpen ? "▼" : "▶"}</span>
                </div>


                {votesOpen && (

                    <div style={selectedGrid}>

                        {Array(5).fill().map((_, i) => {

                            const design = selected[i];

                            return (

                                <div key={i} style={selectedBox}>

                                    {design ? (

                                        <>
                                            <img
                                                src={design.url}
                                                alt={design.id}
                                                style={selectedImage}
                                                onClick={() => setPreview(design.url)}
                                            />

                                            <p style={fileName}>
                                                {design.id}
                                            </p>

                                            <button
                                                style={removeBtn}
                                                onClick={() => removeVote(design)}
                                            >
                                                ✖
                                            </button>
                                        </>

                                    ) : (

                                        <span style={emptyBox}>
                                            Empty
                                        </span>

                                    )}

                                </div>

                            );

                        })}

                    </div>

                )}

            </div>


            {/* ==========================
          Design Grid
      ===========================*/}

            <div style={grid}>

                {images.slice(0, visible).map(img => (

                    <DesignCard
                        key={img.id}
                        designId={img.id}
                        imageUrl={img.url}
                        selected={selected}
                        setSelected={setSelected}
                        userId={userId}
                        userName={userName}
                        onPreview={setPreview}
                    />

                ))}

            </div>


            {visible < images.length && (

                <button
                    style={loadBtn}
                    onClick={loadMore}
                >
                    Load More Designs
                </button>

            )}


            {/* ==========================
          Image Preview Modal
      ===========================*/}

            {preview && (

                <div
                    style={modal}
                    onClick={() => setPreview(null)}
                >

                    <img
                        src={preview}
                        style={modalImage}
                        onClick={(e) => e.stopPropagation()}
                    />

                </div>

            )}

        </div>

    );

}

export default JerseyVoting;


/* ===============================
   Styles
================================ */

const container = {
    padding: "20px",
    maxWidth: "1200px",
    margin: "auto"
};

const title = {
    marginBottom: "4px"
};

const subtitle = {
    marginBottom: "10px",
    color: "#555"
};

const stickyHeader = {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "#fff",
    padding: "12px",
    borderBottom: "1px solid #eee",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    marginBottom: "20px"
};

const topButtons = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px"
};

const voteHeader = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    background: "#f3f4f6",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
};

const clearBtn = {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    background: "#ef4444",
    color: "white",
    cursor: "pointer"
};

const backBtn = {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer"
};

const selectedGrid = {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "10px"
};

const selectedBox = {
    width: "90px",
    height: "120px",
    border: "2px dashed #ccc",
    borderRadius: "8px",
    textAlign: "center",
    padding: "6px",
    position: "relative",
    background: "#fafafa"
};

const selectedImage = {
    width: "100%",
    height: "80px",
    objectFit: "contain",
    borderRadius: "6px",
    cursor: "pointer"
};

const removeBtn = {
    position: "absolute",
    top: "4px",
    right: "4px",
    background: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    cursor: "pointer"
};

const fileName = {
    fontSize: "10px",
    marginTop: "4px",
    wordBreak: "break-word"
};

const emptyBox = {
    color: "#aaa",
    fontSize: "12px",
    marginTop: "60px",
    display: "block"
};

const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
    gap: "15px"
};

const loadBtn = {
    marginTop: "25px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#22c55e",
    color: "white",
    cursor: "pointer"
};

const modal = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200
};

const modalImage = {
    maxWidth: "90%",
    maxHeight: "90%",
    borderRadius: "10px"
};

const closeBtn = {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    fontSize: "18px",
    cursor: "pointer"
};