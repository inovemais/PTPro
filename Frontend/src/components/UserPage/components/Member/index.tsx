import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Container, Row, Col, Button } from "reactstrap";
import styles from "./styles.module.scss";
import { CameraMedia } from "../../../CameraMedia";
import { usePostData } from "../../../AdminPage/hooks/usePostData";
import { useGetMember } from "../../../../hooks/useGetMember";

// Interfaces
interface Role {
  name?: string;
  scope?: string | string[];
}

interface User {
  _id: string;
  memberId?: string | null;
  role?: Role;
  name?: string;
}

interface Member {
  _id?: string;
  taxNumber: string;
  photo?: string;
  userId?: string;
}

interface MemberFormData {
  taxNumber: string;
  base64image?: string | null;
}

interface MemberProps {
  user: User;
}

export const Member = ({ user }: MemberProps) => {
    const [showForm, setShowForm] = useState<boolean>(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const { isLoading: isLoadingPost, addData } = usePostData(
        `users/${user._id}/member`
    );
    const { member, isLoading: isLoadingMember } = useGetMember(user?.memberId || null);
    const { register, handleSubmit, reset } = useForm<MemberFormData>();
    
    // Verificar se é membro - corrigir para usar scope (sem 's')
    const role = user?.role || {};
    const scopes = Array.isArray(role.scope) ? role.scope : (role.scope ? [role.scope] : []);
    const isMember = scopes.includes("member");
    
    const addMember = (data: MemberFormData) => {
        const body: MemberFormData = {
            ...data,
            base64image: imageSrc,
        };
        addData(body);
    };
    
    useEffect(() => {
        if (isMember && member) {
            // reset form with user data
            reset({
                taxNumber: member.taxNumber || "",
            });
        }
    }, [member, isMember, reset]);
    
    if (!showForm && !isMember) {
        return (
            <Button 
                className={styles.button} 
                onClick={() => setShowForm(!showForm)}
            >
                Be a Member
            </Button>
        );
    }
    
    return (
        <Container>
            <Row>
                <Col className={styles.column}>
                    <h3>Member Perfil</h3>
                    <div className={styles.container}>
                        {!isMember && (
                            <form className={styles.form} onSubmit={handleSubmit(addMember)}>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="taxNumber">
                                        Tax Number:
                                    </label>
                                    <input
                                        id="taxNumber"
                                        type="text"
                                        name="taxNumber"
                                        required
                                        {...register("taxNumber")}
                                    />
                                </div>
                                <CameraMedia setImage={setImageSrc} imageFile={imageSrc} />
                                <Row>
                                    <input className="submit" type="submit" disabled={isLoadingPost} />
                                </Row>
                            </form>
                        )}
                        {isMember && (
                            <>
                                {isLoadingMember ? (
                                    <p>Loading member data...</p>
                                ) : member ? (
                                    <>
                                        <div className={styles.field}>
                                            <label className={styles.label} htmlFor="taxNumber">
                                                Tax Number:
                                            </label>
                                            <span>{member.taxNumber}</span>
                                        </div>
                                        {member.photo && (
                                            <div className={styles.field}>
                                                <label className={styles.label} htmlFor="photo">
                                                    Photo:
                                                </label>
                                                <img 
                                                    alt="Member photo" 
                                                    src={member.photo.startsWith('http') ? member.photo : `/uploads/${member.photo}`} 
                                                    className={styles.memberPhoto}
                                                />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p>No member data found</p>
                                )}
                            </>
                        )}
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

