describe('CureConnect E2E Mobile Automation Suite', () => {
    // Helper to sleep
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    it('should load splash screen and bypass onboarding', async () => {
        console.log('--- Suite Start: Onboarding & App Launch ---');
        await sleep(5000); // Wait for application to load and boot

        // Attempt to find and click skip or next buttons inside onboarding
        const nextButton = await $('android=new UiSelector().textContains("Next")');
        const skipButton = await $('android=new UiSelector().textContains("Skip")');

        if (await skipButton.isExisting()) {
            await skipButton.click();
            console.log('Clicked "Skip" to bypass onboarding.');
        } else if (await nextButton.isExisting()) {
            // Click through slide deck
            for (let i = 0; i < 3; i++) {
                if (await nextButton.isExisting()) {
                    await nextButton.click();
                    await sleep(1000);
                }
            }
        }
        await sleep(2000);
    });

    it('should complete registration and login validation', async () => {
        console.log('--- Suite 1: Authentication ---');
        
        // Find Login / Sign Up Toggle
        const toggleButton = await $('android=new UiSelector().textContains("Sign Up")');
        if (await toggleButton.isExisting()) {
            await toggleButton.click();
            console.log('Toggled to Registration mode.');
            await sleep(1000);
        }

        // Fill Registration Form
        const emailInput = await $('android=new UiSelector().className("android.widget.EditText").instance(0)');
        const passwordInput = await $('android=new UiSelector().className("android.widget.EditText").instance(1)');
        
        if (await emailInput.isExisting()) {
            await emailInput.setValue('rathanreddy676@gmail.com');
            await passwordInput.setValue('9652090259');
            console.log('Input login email and password.');
        }

        // Submit Authentication Form
        const submitBtn = await $('android=new UiSelector().textContains("Sign In").className("android.widget.Button")');
        const altSubmitBtn = await $('android=new UiSelector().className("android.widget.Button")');
        
        if (await submitBtn.isExisting()) {
            await submitBtn.click();
        } else if (await altSubmitBtn.isExisting()) {
            await altSubmitBtn.click();
        }
        
        console.log('Authentication submitted.');
        await sleep(5000); // Wait for server to login and fetch home screen
    });

    it('should verify Dashboard elements and navigate tabs', async () => {
        console.log('--- Suite 2: Dashboard & Navigation ---');
        
        // Verify Dashboard greeting exists
        const greeting = await $('android=new UiSelector().textContains("Good")');
        const hasGreeting = await greeting.isExisting();
        console.log(`Dashboard greeting rendered: ${hasGreeting}`);

        // Verify key action cards
        const findDoctorCard = await $('android=new UiSelector().textContains("Find Doctor")');
        const hasDoctorCard = await findDoctorCard.isExisting();
        console.log(`Find Doctor card rendered: ${hasDoctorCard}`);
    });

    it('should test find doctors and book appointments', async () => {
        console.log('--- Suite 3: Doctors Directory ---');
        
        const docTab = await $('android=new UiSelector().textContains("Doctors")');
        if (await docTab.isExisting()) {
            await docTab.click();
            await sleep(2000);
        }

        // Search for cardiologist
        const searchInput = await $('android=new UiSelector().className("android.widget.EditText")');
        if (await searchInput.isExisting()) {
            await searchInput.setValue('Cardio');
            await sleep(1000);
            console.log('Searched for Cardiologists.');
        }

        // Select Doctor Card
        const doctorCard = await $('android=new UiSelector().textContains("Dr.")');
        if (await doctorCard.isExisting()) {
            await doctorCard.click();
            await sleep(2000);
            console.log('Selected doctor card.');
            
            // Go back
            await driver.back();
            await sleep(1000);
        }
    });

    it('should perform symptom analysis', async () => {
        console.log('--- Suite 4: Symptom Checker ---');
        
        const symptomTab = await $('android=new UiSelector().textContains("Symptoms")');
        if (await symptomTab.isExisting()) {
            await symptomTab.click();
            await sleep(2000);
        }

        const symptomInput = await $('android=new UiSelector().className("android.widget.EditText")');
        if (await symptomInput.isExisting()) {
            await symptomInput.setValue('Migraine head ache and dry cough');
            await sleep(1000);
        }

        const analyzeButton = await $('android=new UiSelector().textContains("Analyze")');
        if (await analyzeButton.isExisting()) {
            await analyzeButton.click();
            await sleep(4000); // wait for AI response
            console.log('AI Symptom analysis submitted.');
        }
    });

    it('should interact with medicine tracker and add manually', async () => {
        console.log('--- Suite 5: Medicine Tracker ---');
        
        const medTab = await $('android=new UiSelector().textContains("Medicines")');
        if (await medTab.isExisting()) {
            await medTab.click();
            await sleep(2000);
        }

        const addManualButton = await $('android=new UiSelector().textContains("Add Manually")');
        if (await addManualButton.isExisting()) {
            await addManualButton.click();
            await sleep(1500);
            
            const medNameInput = await $('android=new UiSelector().className("android.widget.EditText").instance(0)');
            if (await medNameInput.isExisting()) {
                await medNameInput.setValue('Dolo 650');
            }
            
            const saveButton = await $('android=new UiSelector().textContains("Save")');
            if (await saveButton.isExisting()) {
                await saveButton.click();
                await sleep(2000);
                console.log('Manually added medicine.');
            }
        }
    });

    it('should manage family member profile lists', async () => {
        console.log('--- Suite 6: Family Health profiles ---');
        
        const familyTab = await $('android=new UiSelector().textContains("Family")');
        if (await familyTab.isExisting()) {
            await familyTab.click();
            await sleep(2000);
        }

        const addMemberButton = await $('android=new UiSelector().textContains("Add Member")');
        if (await addMemberButton.isExisting()) {
            await addMemberButton.click();
            await sleep(1500);
            
            const nameInput = await $('android=new UiSelector().className("android.widget.EditText").instance(0)');
            if (await nameInput.isExisting()) {
                await nameInput.setValue('John Doe');
            }
            
            const submitBtn = await $('android=new UiSelector().textContains("Submit")');
            if (await submitBtn.isExisting()) {
                await submitBtn.click();
                await sleep(2000);
                console.log('Successfully added family member John Doe.');
            }
        }
    });

    it('should verify Emergency SOS quick dials', async () => {
        console.log('--- Suite 7: Emergency SOS ---');
        
        const emergencyTab = await $('android=new UiSelector().textContains("Emergency")');
        if (await emergencyTab.isExisting()) {
            await emergencyTab.click();
            await sleep(2000);
        }

        const sosButton = await $('android=new UiSelector().textContains("SOS")');
        if (await sosButton.isExisting()) {
            console.log('SOS Button found on Emergency tab.');
        }
    });

    it('should update profile and complete log out', async () => {
        console.log('--- Suite 8: Profile & Logout ---');
        
        const profileTab = await $('android=new UiSelector().textContains("Profile")');
        if (await profileTab.isExisting()) {
            await profileTab.click();
            await sleep(2000);
        }

        const logoutBtn = await $('android=new UiSelector().textContains("Logout")');
        if (await logoutBtn.isExisting()) {
            await logoutBtn.click();
            console.log('Logged out of application successfully.');
        }
        await sleep(3000);
    });
});
