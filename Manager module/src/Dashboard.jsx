import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Link
} from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";

export default function EmployeeCard({ submission }) {
  const [openFeedback, setOpenFeedback] = useState(false);
  const [openImage, setOpenImage] = useState(false);
  const [result, setResult] = useState("");
  const hasFeedback = Boolean(submission.feedback);
  const handleFeedbackOpen = () => {
    if (hasFeedback) setOpenFeedback(true);
  };
  const handleFeedbackClose = () => setOpenFeedback(false);
  const handleImageOpen = () => setOpenImage(true);
  const handleImageClose = () => setOpenImage(false);

  const handleSendResult = () => {
    const payload = {
      EmpId: submission.EmpId,
      Result: result
    };
    fetch("http://localhost:3000/send-result", {
      method: "POST",
    headers: {
        "Content-Type": "application/json"
      },
        body: JSON.stringify(payload)
    })
      .then((response) => {
        if (response.ok) {
            alert("Result sent successfully");
        } else {
            alert("Failed to send result");
        }
      })
      .catch((error) => {
        console.error("Error sending result:", error);
        alert("Error sending result");
      });
  };

  const feedback = submission.feedback || {};

  const alcon = submission.alocationFile || null;
  const alconUrl = alcon
    ? `http://localhost:3000/${alcon.path.replace(/\\/g, "/")}`
    : null;

  return (
    <Card sx={{ maxWidth: 420, borderRadius: 3, boxShadow: 3, m: 2 }}>
      <CardHeader
        avatar={
          <Avatar
            alt={submission.Name}
            src={submission.photoUrl || "/default-avatar.png"}
            sx={{ width: 56, height: 56 }}
          />
        }
        title={
          <Typography variant="h6" fontWeight={600}>
            {submission.Name}
          </Typography>
        }
        subheader={`EmpID: ${submission.EmpId}`}
      />
      <CardContent>
        <Typography variant="body2">
          <strong>Email:</strong> {submission.Email}
        </Typography>
        <Typography variant="body2">
          <strong>Opted Time:</strong> {submission.DateTime}
        </Typography>
        {submission.optionalDateTimes && (
          <Typography variant="body2">
            <strong>Opted Time 2:</strong> {submission.optionalDateTimes.map((e) => e).join(" , ")}
          </Typography>
        )}
        <Typography variant="body2">
          <strong>Project Confirmation:</strong> {submission.projectConfirmation || "N/A"}
        </Typography>
        <Typography variant="body2">
          <strong>Long Leave Plans:</strong> {submission.LongLeavePlans || "N/A"}
        </Typography>

        {alcon && (
          <Typography
            variant="body2"
            sx={{ mt: 1 }}
          >
            <strong>Alcon Screenshot:</strong>{" "}
            <Link
              component="button"
              variant="body2"
              sx={{ cursor: "pointer", color: "primary.main" }}
              onClick={handleImageOpen}
            >
              {alcon.originalName}
            </Link>
          </Typography>
        )}

        <Grid container alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
          <Grid item>
            <Chip
              icon={<FeedbackIcon />}
              label={hasFeedback ? "Feedback" : "No Feedback"}
              color={hasFeedback ? "success" : "default"}
              clickable={hasFeedback}
              onClick={handleFeedbackOpen}
            />
          </Grid>

          <Grid item>
            <TextField
              size="small"
              label="Result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              variant="outlined"
            />
            <Button
              sx={{ ml: 1 }}
              variant="contained"
              onClick={handleSendResult}
            >
              Send
            </Button>
          </Grid>
        </Grid>
      </CardContent>

      <Dialog open={openFeedback} onClose={handleFeedbackClose} maxWidth="sm" fullWidth>
        <DialogTitle>Feedback Details</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2"><strong>Interviewed At:</strong> {new Date(feedback.feedbackAt).toLocaleString()}</Typography>
          <Typography variant="body2"><strong>Work Mode:</strong> {feedback.workMode || "-"}</Typography>
          <Typography variant="body2"><strong>Location:</strong> {feedback.Location || "-"}</Typography>
          <Typography variant="body2"><strong>Project Confirmation:</strong> {feedback.projectConfirmation || "-"}</Typography>
          <Typography variant="body2"><strong>Leave Plans:</strong> {feedback.leavePlans || "-"}</Typography>
          <Typography variant="body2"><strong>Experience:</strong> {feedback.experience || "-"}</Typography>
          <Typography variant="body2"><strong>Skill:</strong> {feedback.skill || "-"}</Typography>
          <Typography variant="body2"><strong>Communication:</strong> {feedback.communication || "-"}</Typography>
          <Typography variant="body2"><strong>Technical Knowledge:</strong> {feedback.technicalKnowledge || "-"}</Typography>
          <Typography variant="body2"><strong>Status:</strong> {feedback.status || "-"}</Typography>
          <Typography variant="body2"><strong>Feedback:</strong> {feedback.feedback || "-"}</Typography>
          <Typography variant="body2"><strong>Additional Feedback:</strong> {feedback.additionalFeedback || "-"}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeedbackClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {alconUrl && (
        <Dialog open={openImage} onClose={handleImageClose} maxWidth="md" fullWidth>
          <DialogTitle>{alcon.originalName}</DialogTitle>
          <DialogContent dividers>
            <img
              src={alconUrl}
              alt={alcon.originalName}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "8px"
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => window.open(alconUrl, "_blank")}>
              Open in New Tab
            </Button>
            <Button onClick={handleImageClose}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Card>
  );
}
