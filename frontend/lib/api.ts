const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// No Login Response Interface because response returns No Content (204) on successful login
export interface LoginPayload {
    username: string;
    password: string;
}
export interface RegisterPayload {
    email: string;
    password: string;
    role?: "ADMIN" | "USER";
}

export interface RegisterResponse {
    id: string;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    is_superuser: boolean;
}


/**
 * Attempt to authenticate a user using a cookie-based session by POSTing form-encoded credentials.
 *
 * @param payload - Object containing `username` and `password` to submit for authentication
 * @returns `true` if authentication succeeded
 * @throws Error when the server responds with a non-ok status (the error message will prefer the server-provided `detail` when available) or when a network/error occurs
 *  * Note: fastapi-users with cookie-based authentication does not return any content in the response body.
 * Instead, it returns a 204 No Content status and sets the authentication cookie via the `Set-Cookie` header,
 * which is automatically handled by the browser when `credentials: "include"` is specified.
 */
export async function loginUser(payload: LoginPayload): Promise<boolean> {
    try {
        const formData = new URLSearchParams();
        formData.append('grant_type', 'password');
        formData.append('username', payload.username);
        formData.append('password', payload.password);
        const response = await fetch(`${API_URL}/auth/cookie/login`, {
            method: "POST",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
            credentials: "include"
        });
        if (!response.ok) {
            const data = await response.json().catch(() => { });
            throw new Error(data?.detail || "Login failed");
        }
        return true;
    }
    catch (error) {
        console.log("Error occurred while loginUser");
        throw error;
    }
}

/**
 * Create a new user account using the provided registration data.
 *
 * @param payload - Registration fields (expected: `email` and `password`)
 * @returns The created user's data: `id`, `email`, `is_active`, `is_verified`, and `is_superuser`
 * @throws Error if the registration request fails; message contains server `detail` when available
 */

export async function handleSignup(payload: RegisterPayload): Promise<RegisterResponse> {

    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
    }

    return data as RegisterResponse;
}

/**
 * Retrieves the currently authenticated user's profile from the API.
 *
 * @returns The parsed JSON object representing the current user.
 * @throws Error when the request fails; the error message is the server's `detail` field when available.
 */
export async function getCurrentUser() {
    const response = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include",
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Fetching user failed");
    }
    return await response.json();
}

/**
 * Logs out the current user by calling the API's cookie-based logout endpoint.
 *
 * @throws Error when the server responds with a non-ok status — the error message is the server's `detail` field if present, otherwise "Logout failed".
 * @throws Error rethrowing underlying network or unexpected errors encountered while performing the request.
 */
export async function logoutUser() {
    try {
        const response = await fetch(`${API_URL}/auth/cookie/logout`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error((data as any).detail || "Logout failed");
        }
    } catch (error) {
        console.error("Error occurred while logoutUser", error);
        throw error;
    }
}

// ============ TEAMS API ============

export interface Team {
    id: string;
    name: string;
    description?: string;
    created_at: string;
}

export async function getTeams(): Promise<Team[]> {
    const response = await fetch(`${API_URL}/teams/`, {
        credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch teams");
    return response.json();
}

export async function createTeam(data: { name: string; description?: string }): Promise<Team> {
    const response = await fetch(`${API_URL}/teams/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create team");
    }
    return response.json();
}

// ============ EQUIPMENT API ============

export interface Equipment {
    id: string;
    name: string;
    category: string;
    company?: string;
    description?: string;
    used_by_type?: "EMPLOYEE" | "DEPARTMENT";
    used_by_user_id?: string;
    used_in_location?: string;
    work_center?: string;
    maintenance_team_id?: string;
    default_technician_id?: string;
    assigned_date?: string;
    scrap_date?: string;
    is_scrapped: boolean;
    created_at: string;
    updated_at: string;
}

export interface EquipmentCreate {
    name: string;
    category: string;
    company?: string;
    description?: string;
    used_by_type?: "EMPLOYEE" | "DEPARTMENT";
    used_by_user_id: string;
    maintenance_team_id: string;
    default_technician_id: string;
    used_in_location?: string;
    work_center?: string;
    assigned_date?: string;
}

export async function getEquipment(): Promise<Equipment[]> {
    const response = await fetch(`${API_URL}/equipment/`, {
        credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch equipment");
    return response.json();
}

export async function getMyEquipment(): Promise<Equipment[]> {
    const response = await fetch(`${API_URL}/equipment/my/list`, {
        credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch equipment");
    return response.json();
}

export async function createEquipment(data: EquipmentCreate): Promise<Equipment> {
    const response = await fetch(`${API_URL}/equipment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create equipment");
    }
    return response.json();
}

// ============ TICKETS API ============

export interface Ticket {
    id: string;
    subject: string;
    description?: string;
    equipment_id: string;
    maintenance_team_id: string;
    assigned_user_id?: string;
    request_type: "CORRECTIVE" | "PREVENTIVE";
    status: "NEW" | "IN_PROGRESS" | "REPAIRED" | "SCRAP";
    priority: number;
    scheduled_date?: string;
    completed_at?: string;
    duration_hours?: number;
    company?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface TicketCreate {
    subject: string;
    description?: string;
    equipment_id: string;
    request_type?: "CORRECTIVE" | "PREVENTIVE";
}

export interface TicketAdminUpdate {
    subject?: string;
    description?: string;
    status?: "NEW" | "IN_PROGRESS" | "REPAIRED" | "SCRAP";
    priority?: number;
    scheduled_date?: string;
    duration_hours?: number;
    assigned_user_id?: string;
}

export async function getTickets(): Promise<Ticket[]> {
    const response = await fetch(`${API_URL}/tickets/`, {
        credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch tickets");
    return response.json();
}

export async function getMyTickets(): Promise<Ticket[]> {
    const response = await fetch(`${API_URL}/tickets/my`, {
        credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch tickets");
    return response.json();
}

export async function createTicket(data: TicketCreate): Promise<Ticket> {
    const response = await fetch(`${API_URL}/tickets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create ticket");
    }
    return response.json();
}

export async function updateTicket(id: string, data: TicketAdminUpdate): Promise<Ticket> {
    const response = await fetch(`${API_URL}/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update ticket");
    }
    return response.json();
}