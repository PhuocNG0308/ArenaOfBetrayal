import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { PrisonersDilemma } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
  dave: HardhatEthersSigner;
};

enum Choice {
  Cooperate = 0,
  Defect = 1,
}

enum ConditionSubject {
  RoundNumber = 0,
  MyLastMove = 1,
  OpponentLastMove = 2,
  MyTotalDefects = 3,
  OpponentTotalDefects = 4,
  OpponentTotalCooperates = 5,
}

enum ConditionOperator {
  Is = 0,
  IsNot = 1,
  GreaterThan = 2,
  LessThan = 3,
  Equals = 4,
}

enum TournamentStatus {
  Registration = 0,
  PendingComputation = 1,
  ResultsPublished = 2,
  Finished = 3,
}

// Helper to format strategy for contract
function formatStrategy(rules: any[], defaultAction: Choice) {
  const subjects = rules.map((r: any) => r.subject);
  const operators = rules.map((r: any) => r.operator);
  const values = rules.map((r: any) => r.value);
  
  // Mock input proof: encode the number of handles expected (rules.length + 1 for default action)
  const inputProof = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [rules.length + 1]);

  return [inputProof, subjects, operators, values] as const;
}

async function deployFixture() {
  // Deploy Mock Input Verifier
  const mockFactory = await ethers.getContractFactory("MockInputVerifier");
  const mockVerifier = await mockFactory.deploy();
  await mockVerifier.waitForDeployment();
  const mockAddress = await mockVerifier.getAddress();

  const factory = await ethers.getContractFactory("PrisonersDilemma");
  const contract = (await factory.deploy(mockAddress)) as PrisonersDilemma;
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("PrisonersDilemma Tournament Mode", function () {
  let signers: Signers;
  let contract: PrisonersDilemma;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
      dave: ethSigners[4],
    };
  });

  beforeEach(async function () {
    ({ contract } = await deployFixture());
  });

  describe("Access Control", function () {
    it("should set deployer as owner", async function () {
      expect(await contract.owner()).to.equal(signers.deployer.address);
    });
  });

  describe("Strategy Submission", function () {
    it("should allow player to submit tit-for-tat strategy", async function () {
      const rules = [
        {
          subject: ConditionSubject.OpponentLastMove,
          operator: ConditionOperator.Is,
          value: Choice.Defect,
          action: Choice.Defect,
        },
      ];

      const args = formatStrategy(rules, Choice.Cooperate);
      const tx = await contract.connect(signers.alice).submitStrategy(...args, { value: ethers.parseEther("0.01") });
      await tx.wait();

      const [subjects, operators, values, isSubmitted] = await contract.getStrategy(signers.alice.address);
      expect(isSubmitted).to.equal(true);
      expect(subjects.length).to.equal(1);
      expect(subjects[0]).to.equal(ConditionSubject.OpponentLastMove);
    });

    it("should not allow submitting strategy twice", async function () {
      const args = formatStrategy([], Choice.Cooperate);
      await contract.connect(signers.alice).submitStrategy(...args, { value: ethers.parseEther("0.01") });
      
      await expect(
        contract.connect(signers.alice).submitStrategy(...args, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Strategy already submitted");
    });

    it("should reject too many rules", async function () {
      const rules = Array(11).fill({ // MAX_RULES is 10
        subject: ConditionSubject.RoundNumber,
        operator: ConditionOperator.Equals,
        value: 1,
        action: Choice.Cooperate,
      });

      const args = formatStrategy(rules, Choice.Cooperate);
      await expect(
        contract.connect(signers.alice).submitStrategy(...args, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Too many rules");
    });

    it("should increment player count on submission", async function () {
      const args1 = formatStrategy([], Choice.Cooperate);
      await contract.connect(signers.alice).submitStrategy(...args1, { value: ethers.parseEther("0.01") });
      
      const args2 = formatStrategy([], Choice.Defect);
      await contract.connect(signers.bob).submitStrategy(...args2, { value: ethers.parseEther("0.01") });

      const info = await contract.getTournamentInfo();
      expect(info.playerCount).to.equal(2);
    });

    // NEW TEST CASE
    it("should allow user to submit a complex strategy successfully", async function () {
        const rules = [
          {
            subject: ConditionSubject.RoundNumber,
            operator: ConditionOperator.LessThan,
            value: 10,
            action: Choice.Cooperate,
          },
          {
            subject: ConditionSubject.MyTotalDefects,
            operator: ConditionOperator.GreaterThan,
            value: 5,
            action: Choice.Defect,
          }
        ];
  
        const args = formatStrategy(rules, Choice.Cooperate);
        await contract.connect(signers.charlie).submitStrategy(...args, { value: ethers.parseEther("0.01") });
  
        const [subjects, operators, values, isSubmitted] = await contract.getStrategy(signers.charlie.address);
        expect(isSubmitted).to.equal(true);
        expect(subjects.length).to.equal(2);
        expect(subjects[0]).to.equal(ConditionSubject.RoundNumber);
        expect(values[0]).to.equal(10);
        expect(subjects[1]).to.equal(ConditionSubject.MyTotalDefects);
        expect(values[1]).to.equal(5);
    });
  });
});
