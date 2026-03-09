export const generateMatchPoster = async ({
  title,
  date,
  venue,
  amount,
  players,
  perHead
}) => {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 1000;

  const ctx = canvas.getContext("2d");

  // Background gradient
  const grad = ctx.createLinearGradient(0,0,0,1000);
  grad.addColorStop(0,"#0f2027");
  grad.addColorStop(1,"#2c5364");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,800,1000);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  // Title
  ctx.font = "bold 48px Arial";
  ctx.fillText("🏸 BADMINTON",400,80);
  ctx.fillText("MATCH DAY",400,140);

  ctx.font = "28px Arial";

  ctx.fillText(`📅 ${date}`,400,220);
  ctx.fillText(`📍 ${venue}`,400,270);
  ctx.fillText(`💰 Booking ₹${amount}`,400,320);

  // Players
  ctx.font = "bold 32px Arial";
  ctx.fillText("PLAYERS",400,400);

  ctx.font = "24px Arial";

  const lines = chunkText(players.join(", "),40);

  let y = 450;
  lines.forEach(line=>{
    ctx.fillText(line,400,y);
    y+=35;
  });

  ctx.font = "bold 28px Arial";
  ctx.fillText(`Per Head ₹${perHead}`,400,y+40);

  ctx.font = "20px Arial";
  ctx.fillText("— Badminton Club —",400,940);

  return canvas.toDataURL("image/png");
};

const chunkText = (text,maxLen)=>{
  const words = text.split(", ");
  const lines=[];
  let line="";

  words.forEach(w=>{
    if((line+w).length>maxLen){
      lines.push(line);
      line=w+", ";
    } else {
      line+=w+", ";
    }
  });

  lines.push(line);
  return lines;
};