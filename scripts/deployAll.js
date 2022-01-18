const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account: " + deployer.address);

  const Authority = await ethers.getContractFactory("OlympusAuthority");
  const authority = await Authority.deploy(
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address
  );
  const migrator = deployer.address;

  const VCASH = await ethers.getContractFactory("VCASH");
  const vcash = await VCASH.deploy(authority.address);

  const SOHM = await ethers.getContractFactory("sOlympus");
  const sOHM = await SOHM.deploy();

  const GOHM = await ethers.getContractFactory("gOHM");
  const gOHM = await GOHM.deploy(migrator, sOHM.address);

  const OlympusTreasury = await ethers.getContractFactory("OlympusTreasury");
  const olympusTreasury = await OlympusTreasury.deploy(vcash.address, "0", authority.address);

  const OlympusStaking = await ethers.getContractFactory("OlympusStaking");
  const staking = await OlympusStaking.deploy(
    vcash.address,
    sOHM.address,
    gOHM.address,
    "2200",
    process.env.FIRST_EPOCH_NUMBER,
    process.env.FIRST_BLOCK_NUMBER,
    authority.address
  );
  console.log("staking deployed");

  const Distributor = await ethers.getContractFactory("Distributor");
  const distributor = await Distributor.deploy(
    olympusTreasury.address,
    vcash.address,
    staking.address,
    authority.address
  );
  console.log("distributor deployed");

  const OlympusBondDepository = await ethers.getContractFactory("OlympusBondDepository");
  const bondDepository = await OlympusBondDepository.deploy(vcash.address, olympusTreasury.address, authority.address);
  console.log("bond depository deployed");

  const OlympusBondingCalculator = await ethers.getContractFactory("OlympusBondingCalculator");
  const bondingCalculator = await OlympusBondingCalculator.deploy(vcash.address);
  console.log("bonding calculator deployed");

  const BondTeller = await ethers.getContractFactory("BondTeller");
  const bondTeller = await BondTeller.deploy(bondDepository.address, staking.address, olympusTreasury.address, vcash.address, sOHM.address, authority.address);

  console.log("Olympus Authority: ", authority.address);
  console.log("VCASH: " + vcash.address);
  console.log("sOhm: " + sOHM.address);
  console.log("gOHM: " + gOHM.address);
  console.log("Olympus Treasury: " + olympusTreasury.address);
  console.log("Staking Contract: " + staking.address);
  console.log("Distributor: " + distributor.address);
  console.log("BondDepository: " + bondDepository.address);
  console.log("BondingCalculator: " + bondingCalculator.address);
  console.log("BondTeller: " + bondTeller.address);

  await authority.deployed()
  await vcash.deployed()
  await sOHM.deployed()
  await gOHM.deployed()
  await olympusTreasury.deployed()
  await staking.deployed()
  await distributor.deployed()
  await bondDepository.deployed()
  await bondingCalculator.deployed()
  await bondTeller.deployed()

  await authority.pushVault(olympusTreasury.address, true); // replaces ohm.setVault(treasury.address)
  // Initialize sohm
  await sOHM.setIndex("7675210820");
  await sOHM.setgOHM(gOHM.address);
  await sOHM.initialize(staking.address, olympusTreasury.address);
  await staking.setDistributor(distributor.address);
  await staking.setDistributor(distributor.address);

  await bondDepository.setTeller(bondTeller.address);

  await bondDepository.addBond(process.env.DAI_ADDRESS, bondingCalculator.address, process.env.BOND_CAPICITY, false);
  await bondDepository.addBond(process.env.WETH_ADDRESS, bondingCalculator.address, process.env.BOND_CAPICITY, false);
  await bondDepository.setTerms(0, process.env.BOND_BCV, true, process.env.BOND_VESTING_LENGTH, process.env.BOND_EXPIRATION, process.env.BOND_CONCLUSION, process.env.MIN_BOND_PRICE, process.env.MAX_BOND_PAYOUT, process.env.MAX_BOND_DEBT, process.env.INITIAL_BOND_DEBT);
  await bondDepository.setTerms(1, process.env.BOND_BCB, true, process.env.BOND_VESTING_LENGTH, process.env.BOND_EXPIRATION, process.env.BOND_CONCLUSION, process.env.MIN_BOND_PRICE, process.env.MAX_BOND_PAYOUT, process.env.MAX_BOND_DEBT, process.env.INITIAL_BOND_DEBT);

  try {
    await hre.run("verify:verify", {
      address: authority.address,
      constructorArguments: [
        deployer.address,
        deployer.address,
        deployer.address,
        deployer.address
      ],
    })
    console.log("authority verify success");
  } catch (e) {
    console.log(e);
  }

  try {
    await hre.run("verify:verify", {
      address: vcash.address,
      constructorArguments: [
        authority.address
      ],
    });
    console.log("vcash verify success");
  } catch (e) {
    console.log(e);
  }

  try {
    await hre.run("verify:verify", {
      address: sOHM.address,
      constructorArguments: [
      ],
    });
    console.log("sOHM verify success");
  } catch (e) {
    console.log(e);
  }

  try {
    await hre.run("verify:verify", {
      address: gOHM.address,
      constructorArguments: [
        migrator,
        sOHM.address
      ],
    });
    console.log("gOHM verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: olympusTreasury.address,
      constructorArguments: [
        vcash.address,
        '0',
        authority.address
      ],
    });
    console.log("treasury verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: staking.address,
      constructorArguments: [
        vcash.address,
        sOHM.address,
        gOHM.address,
        "2200",
        process.env.FIRST_EPOCH_NUMBER,
        process.env.FIRST_BLOCK_NUMBER,
        authority.address
      ],
    });
    console.log("staking verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: distributor.address,
      constructorArguments: [
        olympusTreasury.address,
        vcash.address,
        staking.address,
        authority.address
      ],
    });
    console.log("distributor verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: bondDepository.address,
      constructorArguments: [
        vcash.address,
        olympusTreasury.address,
        authority.address
      ],
    });
    console.log("depository verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: bondingCalculator.address,
      constructorArguments: [
        vcash.address,
      ],
    });
    console.log("calculator verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: bondTeller.address,
      constructorArguments: [
        bondDepository.address,
        staking.address,
        olympusTreasury.address,
        vcash.address,
        sOHM.address,
        authority.address
      ],
    });
    console.log("bondTeller verify success");
  } catch (e) {
    console.log(e)
  }
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
