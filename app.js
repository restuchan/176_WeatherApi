const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;
const apiKey = "4tM4hEwvm5O8DBVqbAxT"; 

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/lokasi", async (req, res) => {
    const kota = req.query.q;

    if (!kota) {
        return res.status(400).json({ message: "Lokasi wajib diisi" });
    }

    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json?key=${apiKey}`;

    try {
        const { data } = await axios.get(url);
        const f = data.features[0];

        if (!f) {
            return res.status(404).json({ message: "Lokasi tidak ditemukan" });
        }

        const cari = (tipe) => {
            if (f.place_type && f.place_type.includes(tipe)) return f.text;
            const c = (f.context || []).find(x => x.id.startsWith(tipe));
            return c ? c.text : null;
        };

        const tipeKecamatan = ["locality", "subregion", "municipal_district", "municipality", "joint_municipality"];
        let kecamatan = "-";
        for (const t of tipeKecamatan) {
            const hasil = cari(t);
            if (hasil) { kecamatan = hasil; break; }
        }

        res.json({
            lokasi: f.place_name,
            negara: cari("country") || "-",
            provinsi: cari("region") || "-",
            kecamatan: kecamatan,
            longitude: f.geometry.coordinates[0],
            latitude: f.geometry.coordinates[1]
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Gagal mengambil data dari MapTiler" });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});