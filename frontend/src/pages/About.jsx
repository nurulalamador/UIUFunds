import { CheckCircle2 } from "lucide-react";
import PublicHeader from "../components/PublicHeader";

export default function About() {
  return (
    <div className="public-page">
      <PublicHeader />
      <section className="about-hero">
        <span>ABOUT UIUFUND</span>
        <h1>A simple way for UIU students to help each other financially.</h1>
        <p>
          UIUFund combines peer-to-peer loan requests, crowdfunding, community
          discussion and transparent transaction history in a single
          student-focused platform.
        </p>
      </section>
      <section className="about-grid">
        <div>
          <h2>How the platform works</h2>
          <p>
            A loan request can be published immediately. Other users can propose
            an interest rate and duration, and the requester decides which offer
            to accept. Crowdfunding campaigns go through admin approval before
            they become publicly available.
          </p>
        </div>
        <div className="about-points">
          <p>
            <CheckCircle2 /> Loan requests do not require admin approval
          </p>
          <p>
            <CheckCircle2 /> Loan requester controls which offer is accepted
          </p>
          <p>
            <CheckCircle2 /> Crowdfunding requires admin approval
          </p>
          <p>
            <CheckCircle2 /> Spending and transactions remain traceable
          </p>
        </div>
      </section>
    </div>
  );
}
