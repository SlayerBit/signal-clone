import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACTS_DIR = "/Users/slayer/.gemini/antigravity-ide/brain/eb07a2ed-3ad1-4349-afec-904815aaabc0"
BASE_URL = "http://localhost:3000"

async def run_visual_qa():
    print(f"Starting Complete UI/UX Visual QA on {BASE_URL}...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context_om = await browser.new_context(viewport={"width": 1280, "height": 800})
        page_om = await context_om.new_page()

        # Step 1: Login Om
        print("1. Testing Login Page...")
        await page_om.goto(f"{BASE_URL}/login")
        await page_om.wait_for_selector("input")
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "01_login_page.png"))

        # Enter identifier om and password
        inputs = await page_om.query_selector_all("input")
        if len(inputs) > 0:
            await inputs[0].fill("om")
        if len(inputs) > 1:
            await inputs[1].fill("123456")
        submit_btn = await page_om.query_selector("button[type='submit']")
        if submit_btn:
            await submit_btn.click()
        await page_om.wait_for_timeout(1000)

        # Check if OTP screen
        otp_inputs = await page_om.query_selector_all("input")
        if len(otp_inputs) > 0 and "Verification" in await page_om.content():
            await otp_inputs[0].fill("123456")
            verify_btn = await page_om.query_selector("button[type='submit']")
            if verify_btn:
                await verify_btn.click()
            await page_om.wait_for_timeout(1500)

        await page_om.wait_for_url("**/chats**", timeout=10000)
        print("Logged in successfully, arrived at /chats")
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "02_chats_overview.png"))

        # Step 2: Open Rahul Sharma chat
        print("2. Opening Rahul Sharma chat...")
        rahul_item = page_om.locator("text=Rahul Sharma").first
        await rahul_item.click()
        await page_om.wait_for_timeout(1500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "03_chat_om_rahul.png"))

        # Send a message
        print("3. Sending message in chat...")
        composer = page_om.locator("textarea[placeholder='Message']").first
        await composer.wait_for(timeout=5000)
        await composer.fill("Signal UI visual QA message from Om")
        await page_om.keyboard.press("Enter")
        await page_om.wait_for_timeout(1000)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "04_message_sent.png"))

        # Test hover actions (adjacent toolbar)
        print("4. Testing anchored message hover actions...")
        bubble = page_om.locator("div.group").last
        await bubble.hover()
        await page_om.wait_for_timeout(500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "05_message_hover_actions.png"))

        # Test reaction picker
        print("5. Testing reaction picker popup...")
        react_btn = page_om.locator("button[title='React']").last
        if await react_btn.is_visible():
            await react_btn.click()
            await page_om.wait_for_timeout(500)
            await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "06_reaction_picker.png"))
            heart_emoji = page_om.locator("button:has-text('❤️')").last
            if await heart_emoji.is_visible():
                await heart_emoji.click()
                await page_om.wait_for_timeout(800)
                await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "07_reaction_added.png"))

        # Test reply action and composer quote
        print("6. Testing reply action & composer quote...")
        await bubble.hover()
        await page_om.wait_for_timeout(300)
        reply_btn = page_om.locator("button[title='Reply']").last
        if await reply_btn.is_visible():
            await reply_btn.click()
            await page_om.wait_for_timeout(500)
            await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "08_reply_composer.png"))
            # Send quoted reply
            await composer.fill("This is a quoted reply from Om")
            await page_om.keyboard.press("Enter")
            await page_om.wait_for_timeout(1000)
            await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "09_reply_sent.png"))

        # Test In-Chat Message Search
        print("7. Testing in-chat message search...")
        search_icon = page_om.locator("button[title='Search in conversation']").first
        await search_icon.click()
        await page_om.wait_for_timeout(500)
        search_input = page_om.locator("input[placeholder='Search in conversation...']").first
        await search_input.fill("visual QA")
        await page_om.wait_for_timeout(800)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "10_chat_message_search.png"))
        # Close search
        close_search = page_om.locator("button[title='Close search']").first
        await close_search.click()
        await page_om.wait_for_timeout(300)

        # Test Video Call Modal
        print("8. Testing video call dialog...")
        video_btn = page_om.locator("button[title='Video call']").first
        await video_btn.click()
        await page_om.wait_for_timeout(500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "11_video_call_dialog.png"))
        got_it_btn = page_om.locator("button:has-text('Got it')").first
        await got_it_btn.click()
        await page_om.wait_for_timeout(300)

        # Test Audio Call Modal
        print("9. Testing voice call dialog...")
        phone_btn = page_om.locator("button[title='Voice call']").first
        await phone_btn.click()
        await page_om.wait_for_timeout(500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "12_voice_call_dialog.png"))
        got_it_btn = page_om.locator("button:has-text('Got it')").first
        await got_it_btn.click()
        await page_om.wait_for_timeout(300)

        # Step 10: Group Chat and Members
        print("10. Testing Scaler AI Labs group chat...")
        group_item = page_om.locator("text=Scaler AI Labs").first
        await group_item.click()
        await page_om.wait_for_timeout(1000)
        info_btn = page_om.locator("button[title='Group members']").first
        if await info_btn.is_visible():
            await info_btn.click()
            await page_om.wait_for_timeout(500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "13_group_members_pane.png"))
        close_members = page_om.locator("button:has-text('Group members')").first
        # Close members drawer by clicking backdrop or X
        close_x = page_om.locator("button:has(svg.lucide-x)").first
        if await close_x.is_visible():
            await close_x.click()
            await page_om.wait_for_timeout(300)

        # Step 11: New Chat View
        print("11. Testing New Chat view...")
        new_chat_btn = page_om.locator("button[title='New chat']").first
        await new_chat_btn.click()
        await page_om.wait_for_timeout(500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "14_new_chat_view.png"))
        # Back from new chat
        back_btn = page_om.locator("button:has(svg.lucide-chevron-left)").first
        await back_btn.click()
        await page_om.wait_for_timeout(300)

        # Step 12: Calls Page
        print("12. Testing Calls page...")
        calls_nav = page_om.locator("a[href='/calls']").first
        await calls_nav.click()
        await page_om.wait_for_timeout(500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "15_calls_page.png"))

        # Step 13: Stories Page
        print("13. Testing Stories page...")
        stories_nav = page_om.locator("a[href='/stories']").first
        await stories_nav.click()
        await page_om.wait_for_timeout(500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "16_stories_page.png"))

        # Step 14: Settings Views (Dark Theme)
        print("14. Testing Settings Profile...")
        settings_nav = page_om.locator("a[href='/settings']").first
        await settings_nav.click()
        await page_om.wait_for_timeout(500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "17_settings_profile.png"))

        print("15. Testing Settings Appearance (Dark)...")
        appearance_nav = page_om.locator("text=Appearance").first
        await appearance_nav.click()
        await page_om.wait_for_timeout(500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "18_settings_appearance_dark.png"))

        # Step 15: Switch to LIGHT THEME!
        print("16. Switching to LIGHT THEME...")
        light_card = page_om.locator("text=Signal Light").first
        await light_card.click()
        await page_om.wait_for_timeout(800)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "19_settings_appearance_light.png"))

        # Verify other settings in light mode
        print("17. Testing Chats Settings in Light Mode...")
        chats_settings_nav = page_om.locator("a[href='/settings/chats']").first
        await chats_settings_nav.click()
        await page_om.wait_for_timeout(400)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "20_settings_chats_light.png"))

        print("18. Testing Privacy Settings in Light Mode...")
        privacy_settings_nav = page_om.locator("a[href='/settings/privacy']").first
        await privacy_settings_nav.click()
        await page_om.wait_for_timeout(400)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "21_settings_privacy_light.png"))

        # Check Chats View in Light Mode
        print("19. Testing Chats Overview in Light Mode...")
        chats_nav = page_om.locator("a[href='/chats']").first
        await chats_nav.click()
        await page_om.wait_for_timeout(800)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "22_chats_overview_light.png"))

        # Open Rahul chat in Light Mode
        print("20. Testing Direct Chat in Light Mode...")
        rahul_in_light = page_om.locator("text=Rahul Sharma").first
        await rahul_in_light.click()
        await page_om.wait_for_timeout(1000)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "23_chat_light_mode.png"))

        # Switch back to Dark Theme for Multi-User Test
        print("21. Switching back to Dark Theme...")
        settings_nav = page_om.locator("a[href='/settings']").first
        await settings_nav.click()
        await page_om.wait_for_timeout(400)
        appearance_nav = page_om.locator("text=Appearance").first
        await appearance_nav.click()
        await page_om.wait_for_timeout(400)
        dark_card = page_om.locator("text=Signal Dark").first
        await dark_card.click()
        await page_om.wait_for_timeout(600)

        # Step 22: Multi-user live session test (Om + Rahul)
        print("22. Testing multi-user simultaneous sessions (Om + Rahul)...")
        context_rahul = await browser.new_context(viewport={"width": 1280, "height": 800})
        page_rahul = await context_rahul.new_page()

        # Login Rahul
        await page_rahul.goto(f"{BASE_URL}/login")
        inputs_r = await page_rahul.query_selector_all("input")
        if len(inputs_r) > 0:
            await inputs_r[0].fill("rahul")
        if len(inputs_r) > 1:
            await inputs_r[1].fill("123456")
        submit_btn = await page_rahul.query_selector("button[type='submit']")
        if submit_btn:
            await submit_btn.click()
        await page_rahul.wait_for_timeout(1000)
        otp_inputs_r = await page_rahul.query_selector_all("input")
        if len(otp_inputs_r) > 0 and "Verification" in await page_rahul.content():
            await otp_inputs_r[0].fill("123456")
            verify_btn = await page_rahul.query_selector("button[type='submit']")
            if verify_btn:
                await verify_btn.click()
            await page_rahul.wait_for_timeout(1500)
        await page_rahul.wait_for_url("**/chats**", timeout=10000)

        # Rahul opens Om's chat
        om_chat_in_rahul = page_rahul.locator("text=Om").first
        await om_chat_in_rahul.click()
        await page_rahul.wait_for_timeout(1000)

        # Bring Om back to Rahul's chat
        chats_nav = page_om.locator("a[href='/chats']").first
        await chats_nav.click()
        await page_om.wait_for_timeout(500)
        rahul_in_om = page_om.locator("text=Rahul Sharma").first
        await rahul_in_om.click()
        await page_om.wait_for_timeout(1000)

        # Om types -> Rahul should see typing indicator
        print("Om typing live...")
        composer_om = page_om.locator("textarea[placeholder='Message']").first
        await composer_om.type("Live typing test from Om...", delay=80)
        await page_rahul.wait_for_timeout(800)
        await page_rahul.screenshot(path=os.path.join(ARTIFACTS_DIR, "24_rahul_sees_typing.png"))

        # Om sends -> Rahul should receive live
        print("Om sends message...")
        await page_om.keyboard.press("Enter")
        await page_rahul.wait_for_timeout(1500)
        await page_rahul.screenshot(path=os.path.join(ARTIFACTS_DIR, "25_rahul_received_live.png"))

        # Rahul replies live
        print("Rahul replies live...")
        composer_r = page_rahul.locator("textarea[placeholder='Message']").first
        await composer_r.fill("Got your message instantly Om! Both themes look great.")
        await page_rahul.keyboard.press("Enter")
        await page_om.wait_for_timeout(1500)
        await page_om.screenshot(path=os.path.join(ARTIFACTS_DIR, "26_om_received_rahul_reply.png"))

        await browser.close()
        print("Visual QA and Multi-user live testing completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_visual_qa())
