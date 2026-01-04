const express = require("express");
const QRCode = require("qrcode");
const Users = require("../data/users");

const QRCodeRouter = () => {
  let router = express();

  // Endpoint público para obter QR code de login para um userId
  // GET /api/qrcode/login/:userId
  router.route("/login/:userId").get(function (req, res, next) {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    }

    // Verificar se o utilizador existe
    Users.findUserById(userId)
      .then((user) => {
        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }

        // Criar dados do QR code
        const qrCodeData = JSON.stringify({
          type: "login",
          userId: userId,
          timestamp: Date.now(),
        });

        // Gerar QR code como imagem base64
        QRCode.toDataURL(qrCodeData, {
          errorCorrectionLevel: "M",
          type: "image/png",
          width: 300,
        })
          .then((qrCodeImage) => {
            res.status(200).send({
              qrCode: qrCodeImage,
              userId: userId,
            });
          })
          .catch((err) => {
            console.error("Error generating QR code:", err);
            res.status(500).send({ error: "Failed to generate QR code" });
          });
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        res.status(500).send({ error: "Error fetching user" });
      });
  });

  return router;
};

module.exports = QRCodeRouter;

