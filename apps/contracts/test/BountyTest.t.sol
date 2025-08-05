// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {GitHubBountyDispenser} from "../src/Bounty.sol";

contract GitHubBountyDispenserTest is Test {
    GitHubBountyDispenser bountyDispenser;
    address owner = address(0x1);
    address user1 = address(0x2);
    address user2 = address(0x3);
    uint256 issueId = 123;
    uint256 bountyAmount = 1 ether;

    function setUp() public {
        vm.prank(owner);
        bountyDispenser = new GitHubBountyDispenser(owner);

        // Fund the contract
        vm.deal(address(bountyDispenser), 10 ether);
    }

    function test_InitialState() public view {
        assertEq(bountyDispenser.owner(), owner);
        assertEq(address(bountyDispenser).balance, 10 ether);
    }

    function test_CreateBounty() public {
        vm.prank(owner);
        bountyDispenser.createBounty(issueId, bountyAmount);

        assertEq(bountyDispenser.bounties(issueId), bountyAmount);
    }

    function test_RevertWhen_CreateBounty_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        bountyDispenser.createBounty(issueId, bountyAmount);
    }

    function test_RevertWhen_CreateBounty_ZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(GitHubBountyDispenser.InvalidBountyAmount.selector));
        bountyDispenser.createBounty(issueId, 0);
    }

    function test_RevertWhen_CreateBounty_AlreadyExists() public {
        vm.startPrank(owner);
        bountyDispenser.createBounty(issueId, bountyAmount);

        vm.expectRevert(abi.encodeWithSelector(GitHubBountyDispenser.BountyAlreadyExists.selector, issueId));
        bountyDispenser.createBounty(issueId, bountyAmount);
        vm.stopPrank();
    }

    function test_ReleaseBounty() public {
        // Setup bounty
        vm.prank(owner);
        bountyDispenser.createBounty(issueId, bountyAmount);

        // Test release
        uint256 initialBalance = user1.balance;
        vm.prank(owner);
        bountyDispenser.releaseBounty(issueId, user1);

        assertEq(user1.balance, initialBalance + bountyAmount);
        assertEq(bountyDispenser.bounties(issueId), 0);
        assertTrue(bountyDispenser.claimedBounties(issueId, user1));
    }

    function test_RevertWhen_ReleaseBounty_NotOwner() public {
        vm.prank(owner);
        bountyDispenser.createBounty(issueId, bountyAmount);

        vm.prank(user1);
        vm.expectRevert();
        bountyDispenser.releaseBounty(issueId, user1);
    }

    function test_RevertWhen_ReleaseBounty_NoBounty() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(GitHubBountyDispenser.NoBountyFound.selector, issueId));
        bountyDispenser.releaseBounty(issueId, user1);
    }

    function test_RevertWhen_ReleaseBounty_AlreadyClaimed() public {
        // Setup bounty and claim once
        vm.startPrank(owner);
        bountyDispenser.createBounty(issueId, bountyAmount);
        bountyDispenser.releaseBounty(issueId, user1);

        // Try to claim again
        vm.expectRevert(abi.encodeWithSelector(GitHubBountyDispenser.NoBountyFound.selector, issueId));
        bountyDispenser.releaseBounty(issueId, user1);
        vm.stopPrank();
    }

    function test_RevertWhen_ReleaseBounty_ZeroAddress() public {
        vm.prank(owner);
        bountyDispenser.createBounty(issueId, bountyAmount);

        vm.prank(owner);
        vm.expectRevert(GitHubBountyDispenser.ZeroAddressNotAllowed.selector);
        bountyDispenser.releaseBounty(issueId, address(0));
    }

    function test_EmergencyWithdraw() public {
        uint256 withdrawAmount = 5 ether;
        uint256 initialOwnerBalance = owner.balance;

        vm.prank(owner);
        bountyDispenser.emergencyWithdraw(withdrawAmount);

        assertEq(owner.balance, initialOwnerBalance + withdrawAmount);
        assertEq(address(bountyDispenser).balance, 10 ether - withdrawAmount);
    }

    function test_RevertWhen_EmergencyWithdraw_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        bountyDispenser.emergencyWithdraw(1 ether);
    }

    function test_RevertWhen_EmergencyWithdraw_TooMuch() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(GitHubBountyDispenser.InvalidBountyAmount.selector));
        bountyDispenser.emergencyWithdraw(11 ether);
    }

    function test_Deposit() public {
        uint256 depositAmount = 1 ether;
        uint256 initialBalance = address(bountyDispenser).balance;

        vm.deal(user1, depositAmount);
        vm.prank(user1);
        (bool success,) = address(bountyDispenser).call{value: depositAmount}("");

        assertTrue(success);
        assertEq(address(bountyDispenser).balance, initialBalance + depositAmount);
    }

    function test_Receive() public {
        uint256 receiveAmount = 1 ether;
        uint256 initialBalance = address(bountyDispenser).balance;

        vm.deal(user1, receiveAmount);
        vm.prank(user1);
        (bool success,) = address(bountyDispenser).call{value: receiveAmount}("");

        assertTrue(success);
        assertEq(address(bountyDispenser).balance, initialBalance + receiveAmount);
    }

    function test_BountyExists() public {
        assertFalse(bountyDispenser.bountyExists(issueId));

        vm.prank(owner);
        bountyDispenser.createBounty(issueId, bountyAmount);

        assertTrue(bountyDispenser.bountyExists(issueId));
    }

    function test_GetBalance() public view {
        assertEq(bountyDispenser.getBalance(), 10 ether);
    }
}
