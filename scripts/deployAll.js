const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account: " + deployer.address);

  const bondCapicity = "10000000000000000000000";
  const bondBCV = "369";
  const bondVestingLength = "23000";
  const bondExpiration = "100000000000000";
  const bondConclusion = "100000000000000";
  const minBondPrice = "1000";
  const maxBondPayout = "100";
  const maxBondDebt = "1000000000000000";
  const intialBondDebt = "0";

  //deploy mock stable token
  const DAI = await ethers.getContractFactory("DAI");
  const dai = await DAI.deploy(0);
  await dai.mint(deployer.address, "10000000000000000000000");
  console.log("dai deployed");

  const FRAX = await ethers.getContractFactory("FRAX");
  const frax = await FRAX.deploy(0);
  await frax.mint(deployer.address, "10000000000000000000000");
  console.log("frax deployed");

  const Authority = await ethers.getContractFactory("OlympusAuthority");
  const authority = await Authority.deploy(
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address
  );
  console.log("Authority deployed");
  const migrator = deployer.address;

  const firstEpochNumber = "550";
  const firstBlockNumber = "9505000";

  const VCASH = await ethers.getContractFactory("VCASH");
  const vcash = await VCASH.deploy(authority.address);
  console.log("vcash deployed");

  const SOHM = await ethers.getContractFactory("sOlympus");
  const sOHM = await SOHM.deploy();
  console.log("sohm deployed");

  const GOHM = await ethers.getContractFactory("gOHM");
  const gOHM = await GOHM.deploy(migrator, sOHM.address);
  console.log("gohm deployed");

  const OlympusTreasury = await ethers.getContractFactory("OlympusTreasury");
  const olympusTreasury = await OlympusTreasury.deploy(vcash.address, "0", authority.address);
  console.log("treasury deployed");

  const OlympusStaking = await ethers.getContractFactory("OlympusStaking");
  const staking = await OlympusStaking.deploy(
    vcash.address,
    sOHM.address,
    gOHM.address,
    "2200",
    firstEpochNumber,
    firstBlockNumber,
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

  console.log("DAI: " + dai.address);
  console.log("FRAX: " + frax.address);
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
  console.log("all deploy verified");

  await authority.pushVault(olympusTreasury.address, true); // replaces ohm.setVault(treasury.address)
  // Initialize sohm
  await sOHM.setIndex("7675210820");
  await sOHM.setgOHM(gOHM.address);
  await sOHM.initialize(staking.address, olympusTreasury.address);
  await staking.setDistributor(distributor.address);
  await staking.setDistributor(distributor.address);
  console.log("initial setting performed");

  await bondDepository.setTeller(bondTeller.address);
  console.log("set bondTeller")

  //bond depository setting
  await bondDepository.addBond(dai.address, bondingCalculator.address, bondCapicity, false);
  await bondDepository.addBond(frax.address, bondingCalculator.address, bondCapicity, false);
  console.log("tokens added to bond depository");
  await bondDepository.setTerms(0, bondBCV, true, bondVestingLength, bondExpiration, bondConclusion, minBondPrice, maxBondPayout, maxBondDebt, intialBondDebt);
  await bondDepository.setTerms(1, bondBCV, true, bondVestingLength, bondExpiration, bondConclusion, minBondPrice, maxBondPayout, maxBondDebt, intialBondDebt);
  console.log("deploy finished");

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
        firstEpochNumber,
        firstBlockNumber,
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

  try {
    await hre.run("verify:verify", {
      address: dai.address,
      constructorArguments: [
        0
      ],
    });
    console.log("dai verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: frax.address,
      constructorArguments: [
        0
      ],
    });
    console.log("frax verify success");
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
