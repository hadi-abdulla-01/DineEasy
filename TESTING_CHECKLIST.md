# Testing Checklist - Firebase Authentication Migration

## Pre-Testing Setup

- [ ] Environment variables configured in `.env.local`
  - [ ] All Firebase credentials added
  - [ ] SUPER_ADMIN_EMAIL set
- [ ] Super admin account created in Firebase Console
- [ ] Development server running (`npm run dev`)

## Test 1: Super Admin Login

- [ ] Navigate to `/admin` (login page)
- [ ] Enter super admin email and password
- [ ] Click "Log In"
- [ ] **Expected**: Redirected to `/admin/superadmin`
- [ ] **Expected**: See "Super Admin Panel" with restaurant list
- [ ] **Expected**: See "New Restaurant" button

## Test 2: Create Restaurant via Super Admin

- [ ] Click "New Restaurant" button
- [ ] Fill in form:
  - Restaurant Name: "Test Restaurant"
  - Restaurant ID: "testrestaurant"
  - Admin Password: "test123456"
- [ ] Click "Create Restaurant"
- [ ] **Expected**: Success message appears
- [ ] **Expected**: Admin email shown: `admin@testrestaurant.dineezee`
- [ ] **Expected**: New restaurant appears in list

## Test 3: Restaurant Admin Login

- [ ] Logout from super admin
- [ ] Navigate to `/admin` (login page)
- [ ] Enter: `admin@testrestaurant.dineezee`
- [ ] Enter password: `test123456`
- [ ] Click "Log In"
- [ ] **Expected**: Redirected to `/admin` (dashboard)
- [ ] **Expected**: See restaurant admin dashboard
- [ ] **Expected**: NOT able to access `/admin/superadmin`

## Test 4: Create Kitchen User

- [ ] As restaurant admin, go to User Management
- [ ] Create new kitchen user:
  - Username: "chef1"
  - Email: `chef1@testrestaurant.dineezee`
  - Password: "chef123456"
  - Role: Kitchen
- [ ] **Expected**: User created successfully

## Test 5: Kitchen User Login

- [ ] Logout from admin
- [ ] Navigate to `/kitchen` (kitchen login page)
- [ ] Enter: `chef1@testrestaurant.dineezee`
- [ ] Enter password: "chef123456"
- [ ] Click "Login"
- [ ] **Expected**: Redirected to `/kitchen`
- [ ] **Expected**: See kitchen panel
- [ ] **Expected**: NOT able to access `/admin`

## Test 6: UI/UX Verification

### Admin Login Page
- [ ] Email input shows "Email Address" placeholder
- [ ] Input type is "email"
- [ ] All animations work (fade in, slide in)
- [ ] Button shows "Logging in..." when loading
- [ ] Error messages display correctly
- [ ] "Kitchen Login" link works

### Kitchen Login Page
- [ ] Email input shows "Email Address" placeholder
- [ ] Input type is "email"
- [ ] All animations work (fade in, slide in)
- [ ] Button shows "Logging in..." when loading
- [ ] Error messages display correctly
- [ ] "Admin Login" link works

### Super Admin Panel
- [ ] Modern, premium design
- [ ] Restaurant cards display correctly
- [ ] Create form shows/hides properly
- [ ] Success/error messages styled correctly
- [ ] Delete confirmation works
- [ ] Responsive on mobile

## Test 7: Error Handling

### Invalid Credentials
- [ ] Enter wrong email
- [ ] **Expected**: "Invalid email or password" error
- [ ] Enter wrong password
- [ ] **Expected**: "Invalid email or password" error

### Empty Fields
- [ ] Try to login with empty email
- [ ] **Expected**: "Please enter email and password" error
- [ ] Try to login with empty password
- [ ] **Expected**: "Please enter email and password" error

### Role Restrictions
- [ ] Login as kitchen user
- [ ] Try to access `/admin`
- [ ] **Expected**: Redirected to `/kitchen`
- [ ] Login as admin
- [ ] Try to access `/admin/superadmin`
- [ ] **Expected**: Redirected to `/admin`

## Test 8: Session Persistence

- [ ] Login as admin
- [ ] Refresh the page
- [ ] **Expected**: Still logged in
- [ ] Navigate to different pages
- [ ] **Expected**: Session maintained
- [ ] Logout
- [ ] **Expected**: Session cleared
- [ ] Refresh page
- [ ] **Expected**: Redirected to login

## Test 9: Multiple Restaurants

- [ ] Login as super admin
- [ ] Create second restaurant:
  - Name: "Pizza Palace"
  - ID: "pizzapalace"
  - Password: "pizza123456"
- [ ] **Expected**: Both restaurants visible in list
- [ ] Logout and login as `admin@pizzapalace.dineezee`
- [ ] **Expected**: Can only see Pizza Palace data
- [ ] **Expected**: Cannot see Test Restaurant data

## Test 10: Browser Compatibility

Test in different browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Test 11: Mobile Responsiveness

- [ ] Login pages responsive on mobile
- [ ] Super admin panel responsive on mobile
- [ ] Forms work on mobile
- [ ] Buttons are touch-friendly

## Issues Found

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
|       |          |        |       |

## Sign-off

- [ ] All critical tests passed
- [ ] All UI/UX preserved
- [ ] No console errors
- [ ] Ready for production

**Tested by**: _______________
**Date**: _______________
**Version**: _______________
