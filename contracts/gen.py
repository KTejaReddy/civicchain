import os, json

base = r"C:\Users\Lenovo\Documents\Default Project\civicchain\contracts"

for d in ["contracts", "scripts", "test"]:
    os.makedirs(os.path.join(base, d), exist_ok=True)

pkg = {
    "name": "civicchain",
    "version": "1.0.0",
    "description": "CivicChain - Decentralized Identity & Contribution Tracking",
    "scripts": {"compile": "hardhat compile", "test": "hardhat test", "deploy": "hardhat run scripts/deploy.ts --network", "coverage":