// @dev. This script will deploy this V1.1 of Olympus. It will deploy the whole ecosystem except for the LP tokens and their bonds. 
// This should be enough of a test environment to learn about and test implementations with the Olympus as of V1.1.
// Not that the every instance of the Treasury's function 'valueOf' has been changed to 'valueOfToken'... 
// This solidity function was conflicting w js object property name

const { ethers } = require("hardhat");

async function main() {

  const [deployer, MockDAO] = await ethers.getSigners();
  console.log('Deploying contracts with the account: ' + deployer.address);

  //mock stable coin address
  const daiAddress = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa";
  const wethAddress = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";

  // Initial staking index
  const initialIndex = '7675210820';

  // First block epoch occurs
  const firstEpochBlock = '8961000';

  // What epoch will be first epoch
  const firstEpochNumber = '338';

  // How many blocks are in each epoch
  const epochLengthInBlocks = '2200';

  // Initial reward rate for epoch
  const initialRewardRate = '3000';

  // Ethereum 0 address, used when toggling changes in treasury
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  // DAI bond BCV
  const daiBondBCV = '369';

  // WETH bond BCV
  const wethBondBCV = '690';

  // Bond vesting length in blocks. 33110 ~ 5 days
  const bondVestingLength = '33110';

  // Min bond price
  const minBondPrice = '50000';

  // Max bond payout
  const maxBondPayout = '50'

  // DAO fee for bond
  const bondFee = '10000';

  // Max debt bond can take on
  const maxBondDebt = '1000000000000000';

  // Initial Bond debt
  const intialBondDebt = '0';

  // Depoly Authority
  const Authority = await ethers.getContractFactory("OlympusAuthority");
  const authority = await Authority.deploy(
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address
  );
  console.log("Authority deployed");

  // Deploy VCASH
  const VCASH = await ethers.getContractFactory('VCASH');
  const vcash = await VCASH.deploy(authority.address);
  await vcash.setMinter(deployer.address);
  await vcash.mint(deployer.address, "10000000000000000000000");
  console.log("vcash deployed");

  // Deploy treasury
  //@dev changed function in treaury from 'valueOf' to 'valueOfToken'... solidity function was coflicting w js object property name
  const Treasury = await ethers.getContractFactory('MockOlympusTreasury');
  const treasury = await Treasury.deploy(vcash.address, daiAddress, 0);
  console.log("treasury deployed");

  // Deploy bonding calc
  const OlympusBondingCalculator = await ethers.getContractFactory('OlympusBondingCalculator');
  const olympusBondingCalculator = await OlympusBondingCalculator.deploy(vcash.address);
  console.log("calculator deployed");

  // Deploy staking distributor
  const Distributor = await ethers.getContractFactory('Distributor');
  const distributor = await Distributor.deploy(treasury.address, vcash.address, epochLengthInBlocks, firstEpochBlock);
  console.log("distributor deployed");

  // Deploy sOHM
  const SOHM = await ethers.getContractFactory('sOlympus');
  const sOHM = await SOHM.deploy();
  console.log("sOHM deployed");

  // Deploy Staking
  const Staking = await ethers.getContractFactory('OlympusStaking');
  const staking = await Staking.deploy(vcash.address, sOHM.address, epochLengthInBlocks, firstEpochNumber, firstEpochBlock);
  console.log("staking deployed");

  // Deploy staking warmpup
  const StakingWarmpup = await ethers.getContractFactory('StakingWarmup');
  const stakingWarmup = await StakingWarmpup.deploy(staking.address, sOHM.address);
  console.log("stakingWarmup deployed");

  // Deploy staking helper
  const StakingHelper = await ethers.getContractFactory('StakingHelper');
  const stakingHelper = await StakingHelper.deploy(staking.address, vcash.address);
  console.log("stakingHelper deployed");

  // Deploy DAI bond
  // @dev changed function call to Treasury of 'valueOf' to 'valueOfToken' in BondDepository due to change in Treausry contract
  const DAIBond = await ethers.getContractFactory('MockOlympusBondDepository');
  const daiBond = await DAIBond.deploy(vcash.address, daiAddress, treasury.address, deployer.address, zeroAddress);
  console.log("daiBond deployed");

  // Deploy Weth bond
  // @dev changed function call to Treasury of 'valueOf' to 'valueOfToken' in BondDepository due to change in Treausry contract
  const WethBond = await ethers.getContractFactory('MockOlympusBondDepository');
  const wethBond = await WethBond.deploy(vcash.address, wethAddress, treasury.address, deployer.address, zeroAddress);
  console.log("WethBond deployed");

  // queue and toggle DAI and Weth bond reserve depositor
  await treasury.queue('0', daiBond.address);
  await treasury.queue('2', wethBond.address);
  await treasury.toggle('0', daiBond.address, zeroAddress);
  await treasury.toggle('2', wethBond.address, zeroAddress);
  console.log("treasury queue set");

  // Set DAI and Weth bond terms
  await daiBond.initializeBondTerms(daiBondBCV, bondVestingLength, minBondPrice, maxBondPayout, bondFee, maxBondDebt, intialBondDebt);
  await wethBond.initializeBondTerms(wethBondBCV, bondVestingLength, minBondPrice, maxBondPayout, bondFee, maxBondDebt, intialBondDebt);
  console.log("Bond terms set");

  // Set staking for DAI and Weth bond
  await daiBond.setStaking(staking.address, stakingHelper.address);
  await wethBond.setStaking(staking.address, stakingHelper.address);
  console.log("Bond staking set");

  // Initialize sOHM and set the index
  await sOHM.initialize(staking.address);
  await sOHM.setIndex(initialIndex);
  console.log("sOHM initialized");

  // set distributor contract and warmup contract
  await staking.setContract('0', distributor.address);
  await staking.setContract('1', stakingWarmup.address);
  console.log("staking contract set");

  // Set treasury for VCASH token
  await vcash.setMinter(treasury.address);
  console.log("vcash minter set");

  // Add staking contract as distributor recipient
  await distributor.addRecipient(staking.address, initialRewardRate);
  console.log("distributor recipient set");

  // queue and toggle reward manager
  await treasury.queue('8', distributor.address);
  await treasury.toggle('8', distributor.address, zeroAddress);

  // queue and toggle deployer reserve depositor
  await treasury.queue('0', deployer.address);
  await treasury.toggle('0', deployer.address, zeroAddress);

  // queue and toggle liquidity depositor
  await treasury.queue('4', deployer.address,);
  await treasury.toggle('4', deployer.address, zeroAddress);

  console.log("authority: " + authority.address);
  console.log("vcash: " + vcash.address);
  console.log("Treasury: " + treasury.address);
  console.log("Calc: " + olympusBondingCalculator.address);
  console.log("Staking: " + staking.address);
  console.log("sOHM: " + sOHM.address);
  console.log("Distributor " + distributor.address);
  console.log("Staking Warmup " + stakingWarmup.address);
  console.log("Staking Helper " + stakingHelper.address);
  console.log("DAI Bond: " + daiBond.address);
  console.log("Weth Bond: " + wethBond.address);

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
      address: treasury.address,
      constructorArguments: [
        vcash.address,
        daiAddress,
        0
      ],
    });
    console.log("treasury verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: olympusBondingCalculator.address,
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
      address: staking.address,
      constructorArguments: [
        vcash.address, sOHM.address, epochLengthInBlocks, firstEpochNumber, firstEpochBlock
      ],
    });
    console.log("staking verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: stakingWarmup.address,
      constructorArguments: [
        staking.address, sOHM.address
      ],
    });
    console.log("stakingWarmup verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: distributor.address,
      constructorArguments: [
        treasury.address, vcash.address, epochLengthInBlocks, firstEpochBlock
      ],
    });
    console.log("distributor verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: stakingHelper.address,
      constructorArguments: [
        staking.address, vcash.address
      ],
    });
    console.log("stakingHelper verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: daiBond.address,
      constructorArguments: [
        vcash.address, daiAddress, treasury.address, deployer.address, zeroAddress
      ],
    });
    console.log("daiBond verify success");
  } catch (e) {
    console.log(e)
  }

  try {
    await hre.run("verify:verify", {
      address: wethBond.address,
      constructorArguments: [
        vcash.address, wethAddress, treasury.address, deployer.address, zeroAddress
      ],
    });
    console.log("wethBond verify success");
  } catch (e) {
    console.log(e)
  }
}

main()
  .then(() => process.exit())
  .catch(error => {
    console.error(error);
    process.exit(1);
  })