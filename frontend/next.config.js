/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:3000/api/:path*", // Adjust port if needed
            },
        ];
    },
};

module.exports = nextConfig;
