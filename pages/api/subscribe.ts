import { FieldValue } from "firebase-admin/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebaseAdmin";
import generateSignedUrl from "../../lib/generateSignedUrl";
import { stripHtml } from "string-strip-html";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }
  if (
    req.headers.authorization !== `Bearer ${process.env.GOOGLE_FORMS_TOKEN}`
  ) {
    res.status(401).send("Unauthorized");
    return;
  }

  if (!req.body?.email || !req.body?.firstName || !req.body?.lastName) {
    res.status(400).send("Email and name are required");
    return;
  }

  const { email, firstName, lastName } = req.body;

  const existing = await db
    .collection("subscribers")
    .where("email", "==", email)
    .limit(1)
    .get();
  if (!existing.empty) {
    const snapshot = existing.docs[0];
    const data = snapshot.data();
    console.log(data);
    if ("subscribedAt" in data) {
      res.status(200).send("You are already subscribed");
      return;
    }
    await db.collection("subscribers").doc(snapshot.id).update({
      firstName,
      lastName,
      subscribedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await db.collection("subscribers").doc().set({
      firstName,
      lastName,
      email,
      subscribedAt: FieldValue.serverTimestamp(),
    });
  }

  // if (!process.env.DOMAIN) {
  //   throw new Error("DOMAIN environment variable is not set");
  // }
  // const baseUnsubscribeUrl = new URL(process.env.DOMAIN);
  // baseUnsubscribeUrl.pathname = "unsubscribe";
  // baseUnsubscribeUrl.searchParams.set("email", email);

  // const signedUrl = generateSignedUrl(baseUnsubscribeUrl);
  const htmlMessage = `<div>Hey ${firstName}!</div>
<br />
<div>
  Thank you for registering for
  <a href="https://lelandhacks.com">Leland Hacks</a>!
  The hackathon will be held on Sunday September 18th, at the <a href="https://goo.gl/maps/wY6vCBqyEanwznf68">Vineland Branch Library</a>.
  For now, please join our Discord server (<a href="https://discord.gg/t7ZJ7SpFce">https://discord.gg/t7ZJ7SpFce</a>) to connect with other attendees and get updates on the hackathon.
  And we also have a referral program -- invite your friends to register and tell them to put your name in the "How did you find out about Leland Hacks?" question.
  The participant who refers the most other participants will receive a prize!
</div>
<br />
<div>
  If you have any questions, feel free to email us at team@lelandhacks.com.
  We look forward to seeing you at Leland Hacks! 
</div>
<br />
<div>Happy hacking!</div>
<div>Leland Hacks Team</div>
`;

  const textMessage = stripHtml(htmlMessage, {
    dumpLinkHrefsNearby: {
      enabled: true,
      putOnNewLine: false,
      wrapHeads: "<",
      wrapTails: ">",
    },
  }).result;

  const response = await fetch(
    `${
      process.env.NODE_ENV === "development"
        ? "http://localhost:8787"
        : "https://mailinglist.lelandcs.workers.dev"
    }/sendEmail`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer " + process.env.MAILINGLIST_AUTH_TOKEN,
      },
      body: JSON.stringify({
        email,
        htmlMessage,
        textMessage,
        subject: `${
          process.env.NODE_ENV === "development" ? "[Testing] " : ""
        }Thank You for Registering for Leland Hacks ⚡`,
      }),
    }
  );

  if (!response.ok) {
    res
      .status(400)
      .send(
        `We have added you to our mailing list, but there was an error in sending you an email: ${await response.text()}`
      );
    return;
  }
  res.send("Success");
  return;
};

export default handler;
